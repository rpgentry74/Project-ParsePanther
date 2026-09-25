// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { mergePrerequisiteData } from './prerequisiteDataUtils.js';
import { escapeHTML } from './htmlUtils.js';

export function generateHTMLTable() {
  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData || (!directPrerequisiteData && !indirectPrerequisiteData)) {
    return '<p>Error: Invalid roster data or prerequisite data.</p>';
  }

  const professorName = escapeHTML(rosterData.professor || 'Unknown');
  const courseName = escapeHTML(rosterData.course || 'Unknown');
  const lecNum = escapeHTML(rosterData.lecNum || 'None');
  const labNum = escapeHTML(rosterData.labNum || 'None');

  const {
    prerequisiteCourses: mergedPrerequisites,
    courseAliases: mergedCourseAliases,
  } = mergePrerequisiteData(
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const prerequisiteNames = Object.keys(mergedPrerequisites);

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

  if (prerequisiteNames.length === 0) {
    const outputHTML = `
      ${headerHTML}
      <div class="outputTable">
        <p>No prerequisite courses were listed for the selected prerequisite checks.</p>
      </div>
    `;

    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = outputHTML;
    return outputHTML;
  }

  const prerequisiteHeadersHTML = prerequisiteNames
    .map((prerequisite) => {
      const aliases = mergedCourseAliases[prerequisite] || [];
      const aliasHTML = aliases.length
        ? `<br><small>(${aliases.map(escapeHTML).join(', ')})</small>`
        : '';

      return `<th>${escapeHTML(prerequisite)}${aliasHTML}</th>`;
    })
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
          <td class="center student-info">${escapeHTML(student.studentID)}</td>
          <td class="left student-info">${escapeHTML(student.studentName)}</td>
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
