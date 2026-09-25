// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { mergePrerequisiteData } from './prerequisiteDataUtils.js';
import { escapeHTML } from './htmlUtils.js';

function buildCourseHeader(courseName, aliases = [], label = '') {
  const aliasHTML = aliases.length
    ? `<br><small>(${aliases.map(escapeHTML).join(', ')})</small>`
    : '';

  const labelHTML = label
    ? `<br><small>${escapeHTML(label)}</small>`
    : '';

  return `<th>${escapeHTML(courseName)}${aliasHTML}${labelHTML}</th>`;
}

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
  const totalDisplayColumns =
    prerequisiteNames.length + indirectEvidenceNames.length;

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

  if (totalDisplayColumns === 0) {
    const outputHTML = `
      ${headerHTML}
      <div class="outputTable">
        <p>No prerequisite courses or indirect evidence were listed for the selected checks.</p>
      </div>
    `;

    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = outputHTML;
    return outputHTML;
  }

  const prerequisiteHeadersHTML = prerequisiteNames
    .map((prerequisite) =>
      buildCourseHeader(
        prerequisite,
        courseAliases[prerequisite] || []
      )
    )
    .join('');

  const indirectEvidenceHeadersHTML = indirectEvidenceNames
    .map((courseName) =>
      buildCourseHeader(
        courseName,
        indirectEvidenceAliases[courseName] || [],
        'Indirect'
      )
    )
    .join('');

  const rowsHTML = rosterData.studentRoster
    .map((student) => {
      const studentId = String(student.studentID).trim();

      const prerequisiteCompletionHTML = prerequisiteNames
        .map((prerequisite) => {
          const hasTakenCourse =
            prerequisiteCourses[prerequisite].includes(studentId);
          const checkmarkHTML = hasTakenCourse
            ? '<span class="checkmark">&#x2713;</span>'
            : '';

          return `<td class="evaluated-prerequisite ${hasTakenCourse ? 'taken' : 'not-taken'}">${checkmarkHTML}</td>`;
        })
        .join('');

      const indirectEvidenceHTML = indirectEvidenceNames
        .map((courseName) => {
          const hasEvidence =
            indirectEvidenceCourses[courseName].includes(studentId);
          const checkmarkHTML = hasEvidence
            ? '<span class="checkmark">&#x2713;</span>'
            : '';

          return `<td class="indirect-evidence">${checkmarkHTML}</td>`;
        })
        .join('');

      return `
        <tr>
          <td class="center student-info">${escapeHTML(student.studentID)}</td>
          <td class="left student-info">${escapeHTML(student.studentName)}</td>
          ${prerequisiteCompletionHTML}
          ${indirectEvidenceHTML}
        </tr>
      `;
    })
    .join('');

  const prerequisiteGroupHeader = prerequisiteNames.length
    ? `<th colspan="${prerequisiteNames.length}">Prerequisites</th>`
    : '';

  const indirectGroupHeader = indirectEvidenceNames.length
    ? `<th colspan="${indirectEvidenceNames.length}">Indirect Evidence</th>`
    : '';

  const tableId = 'mergedTable';
  const tableElementHTML = `
    <table class="merged-table" id="${tableId}">
      <thead>
        <tr>
          <th colspan="2">Student Info</th>
          ${prerequisiteGroupHeader}
          ${indirectGroupHeader}
        </tr>
        <tr>
          <th class="center">Student ID</th>
          <th class="left">Student Name</th>
          ${prerequisiteHeadersHTML}
          ${indirectEvidenceHeadersHTML}
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

  const rows = Array.from(
    document.querySelectorAll(`#${tableId} tbody tr`)
  );
  rows.forEach(colorCodeCells);

  return outputHTML;
}
