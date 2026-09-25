// generateSpreadsheetFile.js
import { getState } from './state.js';
import { mergePrerequisiteData, formatPrerequisiteDisplayName } from './prerequisiteDataUtils.js';

export function generateSpreadsheetFile(format) {
  if (!format) {
    return;
  }

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData || (!directPrerequisiteData && !indirectPrerequisiteData)) {
    console.error('Invalid roster data or prerequisite data.');
    return;
  }

  const {
    prerequisiteCourses: mergedPrerequisites,
    courseAliases: mergedCourseAliases,
  } = mergePrerequisiteData(
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const prerequisiteNames = Object.keys(mergedPrerequisites);
  const prerequisiteHeaders = prerequisiteNames.map((prerequisite) =>
    formatPrerequisiteDisplayName(
      prerequisite,
      mergedCourseAliases[prerequisite] || []
    )
  );

  const workbook = XLSX.utils.book_new();

  const rows = [
    ['Course:', rosterData.course],
    ['Professor:', rosterData.professor],
    ['LEC Number:', rosterData.lecNum],
    ['LAB Number:', rosterData.labNum],
    ['', '', '', ''],
    ['Student ID', 'Student Name', ...prerequisiteHeaders],
  ];

  rosterData.studentRoster.forEach((student) => {
    const studentId = String(student.studentID).trim();

    const prerequisiteResults = prerequisiteNames.map((prerequisite) =>
      mergedPrerequisites[prerequisite].includes(studentId) ? '✓' : ''
    );

    rows.push([
      student.studentID,
      student.studentName,
      ...prerequisiteResults,
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
