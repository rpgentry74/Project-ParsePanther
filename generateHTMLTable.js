// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { mergePrerequisiteData } from './prerequisiteDataUtils.js';
import { escapeHTML } from './htmlUtils.js';

function buildCourseHeader(
  courseName,
  aliases = [],
  label = '',
  className = ''
) {
  const aliasHTML = aliases.length
    ? `<br><small>(${aliases.map(escapeHTML).join(', ')})</small>`
    : '';

  const labelHTML = label
    ? `<br><small>${escapeHTML(label)}</small>`
    : '';

  const classAttribute = className
    ? ` class="${className}"`
    : '';

  return `<th scope="col"${classAttribute}>${escapeHTML(courseName)}${aliasHTML}${labelHTML}</th>`;
}

function buildStatus(prerequisiteNames, prerequisiteCourses, studentId) {
  if (prerequisiteNames.length === 0) {
    return {
      className: 'status-neutral',
      text: 'No official prerequisites evaluated',
    };
  }

  const completed = prerequisiteNames.filter((prerequisite) =>
    prerequisiteCourses[prerequisite].includes(studentId)
  ).length;
  const missing = prerequisiteNames.length - completed;

  if (missing === 0) {
    return {
      className: 'status-complete',
      text: 'All prerequisites complete',
    };
  }

  return {
    className: 'status-missing',
    text: `Missing ${missing} prerequisite${missing === 1 ? '' : 's'}`,
  };
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
  const studentCount = rosterData.studentRoster.length;

  const headerHTML = `
    <div class="outputHeader">
      <div>
        <p class="result-eyebrow">Results</p>
        <h2>${courseName}</h2>
        <p class="result-meta">${professorName} &bull; LEC ${lecNum} &bull; LAB ${labNum}</p>
      </div>
      <div class="result-count">${studentCount} student${studentCount === 1 ? '' : 's'}</div>
    </div>
  `;

  if (totalDisplayColumns === 0) {
    const outputHTML = `
      ${headerHTML}
      <div class="outputTable">
        <p class="empty-results">No prerequisite courses or indirect evidence were listed for the selected checks.</p>
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
        'Indirect',
        'indirect-column-header'
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
            ? '<span class="checkmark" aria-label="Completed">&#x2713;</span>'
            : '<span class="not-complete" aria-label="Not completed">&mdash;</span>';

          return `<td class="evaluated-prerequisite ${hasTakenCourse ? 'taken' : 'not-taken'}">${checkmarkHTML}</td>`;
        })
        .join('');

      const indirectEvidenceHTML = indirectEvidenceNames
        .map((courseName) => {
          const hasEvidence =
            indirectEvidenceCourses[courseName].includes(studentId);
          const checkmarkHTML = hasEvidence
            ? '<span class="checkmark" aria-label="Indirect evidence present">&#x2713;</span>'
            : '<span class="not-complete" aria-label="No indirect evidence">&mdash;</span>';

          return `<td class="indirect-evidence">${checkmarkHTML}</td>`;
        })
        .join('');

      const status = buildStatus(
        prerequisiteNames,
        prerequisiteCourses,
        studentId
      );

      return `
        <tr>
          <td class="center student-info">${escapeHTML(student.studentID)}</td>
          <td class="left student-info">${escapeHTML(student.studentName)}</td>
          ${prerequisiteCompletionHTML}
          ${indirectEvidenceHTML}
          <td class="status-cell ${status.className}">${escapeHTML(status.text)}</td>
        </tr>
      `;
    })
    .join('');

  const prerequisiteGroupHeader = prerequisiteNames.length
    ? `<th scope="colgroup" class="prerequisite-group-header" colspan="${prerequisiteNames.length}">Prerequisites</th>`
    : '';

  const indirectGroupHeader = indirectEvidenceNames.length
    ? `<th scope="colgroup" class="indirect-group-header" colspan="${indirectEvidenceNames.length}">Indirect Evidence</th>`
    : '';

  const tableId = 'mergedTable';
  const tableElementHTML = `
    <table class="merged-table" id="${tableId}">
      <thead>
        <tr>
          <th scope="colgroup" class="student-group-header" colspan="2">Student Info</th>
          ${prerequisiteGroupHeader}
          ${indirectGroupHeader}
          <th scope="col" class="status-column-header" rowspan="2">Status</th>
        </tr>
        <tr>
          <th scope="col" class="center">Student ID</th>
          <th scope="col" class="left">Student Name</th>
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
