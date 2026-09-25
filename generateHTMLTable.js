// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { mergePrerequisiteCourses } from './prerequisiteDataUtils.js';

export function generateHTMLTable() {
  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData || (!directPrerequisiteData && !indirectPrerequisiteData)) {
    return '<p>Error: Invalid roster data or prerequisite data.</p>';
  }

  const professorName = rosterData.professor || 'Unknown';
  const courseName = rosterData.course || 'Unknown';
  const lecNum = rosterData.lecNum || 'None';
  const labNum = rosterData.labNum || 'None';

  const mergedPrerequisites = mergePrerequisiteCourses(
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const prerequisiteNames = Object.keys(mergedPrerequisites);

  const prerequisiteHeadersHTML = prerequisiteNames
    .map((prerequisite) => `<th>${prerequisite}</th>`)
    .join('');

  const rowsHTML = rosterData.studentRoster
    .map((student) => {
      const studentId = String(student.studentID).trim();

      const courseCompletionHTML = prerequisiteNames
        .map((prerequisite) => {
          const hasTakenCourse = mergedPrerequisites[prerequisite].includes(studentId);
          const checkmarkHTML = hasTakenCourse
            ? '<span class="checkmark">&#x2713;</span>'
            : '';

          return `<td class="${hasTakenCourse ? 'taken' : 'not-taken'}">${checkmarkHTML}</td>`;
        })
        .join('');

      return `
        <tr>
          <td class="center student-info">${student.studentID}</td>
          <td class="left student-info">${student.studentName}</td>
          ${courseCompletionHTML}
        </tr>
      `;
    })
    .join('');

  const tableId = 'mergedTable';
  const tableElementHTML = `
    <table class="merged-table" id="${tableId}">
      <thead>
        <tr>
          <th colspan="2">Student Info</th>
          <th colspan="${prerequisiteNames.length}">Prerequisites</th>
        </tr>
        <tr>
          <th class="center">Student ID</th>
          <th class="left">Student Name</th>
          ${prerequisiteHeadersHTML}
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `;

  const headerHTML = `
    <div class="outputHeader">
      <header class="header">
        <h2>${courseName}</h2>
        <h3>${professorName}</h3>
        <h4>LEC Number: ${lecNum}</h4>
        <h4>LAB Number: ${labNum}</h4>
      </header>
    </div>
  `;

  const outputHTML = `
    ${headerHTML}
    <div class="outputTable">
      ${tableElementHTML}
    </div>
  `;

  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = outputHTML;

  const rows = Array.from(document.querySelectorAll(`#${tableId} tbody tr`));
  rows.forEach(colorCodeCells);

  return outputHTML;
}
