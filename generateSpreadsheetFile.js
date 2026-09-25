// generateSpreadsheetFile.js
import { getState } from './state.js';
import {
  mergePrerequisiteData,
  formatPrerequisiteDisplayName,
} from './prerequisiteDataUtils.js';
import { recordDiagnostic } from './diagnostics.js';

export function generateSpreadsheetFile(format) {
  if (!format) {
    recordDiagnostic('export-blocked', {
      code: 'FORMAT_REQUIRED',
    });
    return;
  }

  recordDiagnostic('export-selected', { format });

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData || (!directPrerequisiteData && !indirectPrerequisiteData)) {
    recordDiagnostic('export-blocked', {
      code: 'DATA_REQUIRED',
    });
    console.error('Invalid roster data or prerequisite data.');
    return;
  }

  const {
    prerequisiteCourses,
    courseAliases,
    indirectEvidenceCourses,
    indirectEvidenceAliases,
  } = mergePrerequisiteData(
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const prerequisiteNames = Object.keys(prerequisiteCourses);
  const indirectEvidenceNames = Object.keys(indirectEvidenceCourses);

  function studentStatus(studentId) {
    if (prerequisiteNames.length === 0) {
      return 'No official prerequisites evaluated';
    }

    const completed = prerequisiteNames.filter((prerequisite) =>
      prerequisiteCourses[prerequisite].includes(studentId)
    ).length;
    const missing = prerequisiteNames.length - completed;

    if (missing === 0) {
      return 'All prerequisites complete';
    }

    return `Missing ${missing} prerequisite${missing === 1 ? '' : 's'}`;
  }

  const prerequisiteHeaders = prerequisiteNames.map((prerequisite) =>
    formatPrerequisiteDisplayName(
      prerequisite,
      courseAliases[prerequisite] || []
    )
  );

  const indirectEvidenceHeaders = indirectEvidenceNames.map((courseName) =>
    `${formatPrerequisiteDisplayName(
      courseName,
      indirectEvidenceAliases[courseName] || []
    )}\n(Indirect)`
  );

  const workbook = XLSX.utils.book_new();

  const rows = [
    ['Course:', rosterData.course],
    ['Professor:', rosterData.professor],
    ['LEC Number:', rosterData.lecNum],
    ['LAB Number:', rosterData.labNum],
    ['', '', '', ''],
    [
      'Student ID',
      'Student Name',
      ...prerequisiteHeaders,
      ...indirectEvidenceHeaders,
      'Status',
    ],
  ];

  rosterData.studentRoster.forEach((student) => {
    const studentId = String(student.studentID).trim();

    const prerequisiteResults = prerequisiteNames.map((prerequisite) =>
      prerequisiteCourses[prerequisite].includes(studentId) ? '✓' : ''
    );

    const indirectEvidenceResults = indirectEvidenceNames.map((courseName) =>
      indirectEvidenceCourses[courseName].includes(studentId) ? '✓' : ''
    );

    rows.push([
      student.studentID,
      student.studentName,
      ...prerequisiteResults,
      ...indirectEvidenceResults,
      studentStatus(studentId),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster');

  let fileExtension;
  let mimeType;

  switch (format) {
    case 'xlsx':
      fileExtension = 'xlsx';
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      break;
    case 'csv':
      fileExtension = 'csv';
      mimeType = 'text/csv';
      break;
    case 'ods':
      fileExtension = 'ods';
      mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
      break;
    default:
      recordDiagnostic('export-blocked', {
        code: 'INVALID_FORMAT',
      });
      console.error('Invalid format specified.');
      return;
  }

  const fileData = XLSX.write(workbook, {
    type: 'binary',
    bookType: fileExtension,
  });

  const blob = new Blob([s2ab(fileData)], { type: mimeType });

  const courseName = rosterData.course.replace(/[^a-zA-Z0-9]/g, '_');
  const lectureNumber = rosterData.lecNum || 'N/A';
  const labNumber = rosterData.labNum || 'N/A';
  const currentDate = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const fileName =
    `${courseName}_LEC${lectureNumber}_LAB${labNumber}_${currentDate}.${fileExtension}`;

  saveAs(blob, fileName);
  recordDiagnostic('export-generated', { format });
}

export function generateSelectedSpreadsheetFile() {
  const formatSelect = document.getElementById('formatSelect');
  generateSpreadsheetFile(formatSelect.value);
}

document
  .getElementById('downloadBtn')
  .addEventListener('click', generateSelectedSpreadsheetFile);

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);

  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }

  return buf;
}
