import { getState } from './state.js';

let stateData = null;

export function generateSpreadsheetFile(format) {
  // Store state data globally
  console.log('Download button clicked!'); 
  stateData = getState();

  // Check if the format has been provided
  if (!format) {
    // If not, just store the data and don't generate a file yet
    return;
  }

  const { rosterData, classData, indirectClassData } = stateData;

  if (!rosterData || (!classData && !indirectClassData)) {
    console.error('Invalid roster data or class data.');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // Merge classData.prerequisiteCourses and indirectClassData.prerequisiteCourses if they exist
  const directPrerequisites = (classData && classData.prerequisiteCourses) ? classData.prerequisiteCourses : {};
  const indirectPrerequisites = (indirectClassData && indirectClassData.prerequisiteCourses) ? indirectClassData.prerequisiteCourses : {};
  const allPrerequisites = { ...directPrerequisites, ...indirectPrerequisites };

  // Generate a list of unique prerequisites
  const uniquePrerequisites = [...new Set(Object.keys(allPrerequisites))];

  // Generate headers for the spreadsheet
  const headers = [
    ['Course:', rosterData.course],
    ['Professor:', rosterData.professor],
    ['LEC Number:', rosterData.lecNum],
    ['LAB Number:', rosterData.labNum],
    ['', '', '', ''], // Blank line
    ['Student ID', 'Student Name', ...uniquePrerequisites]
  ];

  rosterData.studentRoster.forEach((student) => {
    const rowData = uniquePrerequisites.map((prerequisite) =>
      (directPrerequisites[prerequisite] || indirectPrerequisites[prerequisite]).includes(student.studentID) ? '✓' : ''
    );
    headers.push([student.studentID, student.studentName, ...rowData]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(headers);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster');

  let fileExtension, mimeType;
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

  const fileData = XLSX.write(workbook, { type: 'binary', bookType: fileExtension });
  const blob = new Blob([s2ab(fileData)], { type: mimeType });
  
  // Generate the file name
  const courseName = rosterData.course.replace(/[^a-zA-Z0-9]/g, '_');
  const lectureNumber = rosterData.lecNum || 'N/A';
  const labNumber = rosterData.labNum || 'N/A';
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const fileName = `${courseName}_LEC${lectureNumber}_LAB${labNumber}_${currentDate}.${fileExtension}`;

  saveAs(blob, fileName);
}

export function generateSelectedSpreadsheetFile() {
  // Get the selected format
  const formatSelect = document.getElementById('formatSelect');
  const selectedFormat = formatSelect.value;

  // Call the main function with the selected format
  generateSpreadsheetFile(selectedFormat);
}

// Add an event listener to the download button
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', generateSelectedSpreadsheetFile);

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}
