// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { buildResultsModel } from './resultsModel.js';
import { escapeHTML } from './htmlUtils.js';
import { initializeResultsInteractions } from './resultsInteractions.js';

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

  const classNames = [
    'course-column-header',
    className,
  ].filter(Boolean);

  return `<th scope="col" class="${classNames.join(' ')}">${escapeHTML(courseName)}${aliasHTML}${labelHTML}</th>`;
}

function buildSummaryHTML(
  studentCount,
  prerequisiteNames,
  completeCount,
  missingCount,
  indirectCount
) {
  const officialSummary = prerequisiteNames.length
    ? `
      <div class="summary-stat">
        <strong>${completeCount}</strong>
        <span>Complete</span>
      </div>
      <div class="summary-stat">
        <strong>${missingCount}</strong>
        <span>Missing Prerequisites</span>
      </div>
    `
    : '';

  const indirectSummary = indirectCount > 0
    ? `
      <div class="summary-stat summary-stat-neutral">
        <strong>${indirectCount}</strong>
        <span>With Indirect Evidence</span>
      </div>
    `
    : '';

  return `
    <div class="results-summary" aria-label="Class prerequisite summary">
      <div class="summary-stat">
        <strong>${studentCount}</strong>
        <span>Students</span>
      </div>
      ${officialSummary}
      ${indirectSummary}
    </div>
  `;
}

function buildFilterHTML(
  studentCount,
  prerequisiteNames,
  completeCount,
  missingCount,
  indirectCount
) {
  const officialFilters = prerequisiteNames.length
    ? `
      <button type="button" class="result-filter-button" data-filter="complete" aria-pressed="false">
        Complete <span>${completeCount}</span>
      </button>
      <button type="button" class="result-filter-button" data-filter="missing" aria-pressed="false">
        Missing Prerequisites <span>${missingCount}</span>
      </button>
    `
    : '';

  const indirectFilter = indirectCount > 0
    ? `
      <button type="button" class="result-filter-button" data-filter="indirect" aria-pressed="false">
        Has Indirect Evidence <span>${indirectCount}</span>
      </button>
    `
    : '';

  return `
    <div class="results-toolbar">
      <div class="result-filters" role="group" aria-label="Filter student results">
        <button type="button" class="result-filter-button" data-filter="all" aria-pressed="true">
          All <span>${studentCount}</span>
        </button>
        ${officialFilters}
        ${indirectFilter}
      </div>
      <p id="resultFilterStatus" class="filter-status" role="status" aria-live="polite"></p>
    </div>
  `;
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

  const resultsModel = buildResultsModel(
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const {
    prerequisiteCourses,
    courseAliases,
    indirectEvidenceCourses,
    indirectEvidenceAliases,
    prerequisiteNames,
    indirectEvidenceNames,
    students: studentModels,
    summary: {
      studentCount,
      completeCount,
      missingCount,
      indirectCount,
    },
  } = resultsModel;

  const totalDisplayColumns =
    prerequisiteNames.length + indirectEvidenceNames.length;

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
      ${buildSummaryHTML(
        studentCount,
        prerequisiteNames,
        completeCount,
        missingCount,
        indirectCount
      )}
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
    .map((indirectCourseName) =>
      buildCourseHeader(
        indirectCourseName,
        indirectEvidenceAliases[indirectCourseName] || [],
        'Indirect',
        'indirect-column-header'
      )
    )
    .join('');

  const rowsHTML = studentModels
    .map(({ student, studentId, status, hasIndirectEvidence }) => {
      const prerequisiteCompletionHTML = prerequisiteNames
        .map((prerequisite) => {
          const hasTakenCourse =
            prerequisiteCourses[prerequisite].includes(studentId);
          const checkmarkHTML = hasTakenCourse
            ? '<span class="checkmark" aria-label="Completed">&#x2713;</span>'
            : '<span class="not-complete" aria-label="Not completed">&mdash;</span>';

          return `<td class="course-result-cell evaluated-prerequisite ${hasTakenCourse ? 'taken' : 'not-taken'}">${checkmarkHTML}</td>`;
        })
        .join('');

      const indirectEvidenceHTML = indirectEvidenceNames
        .map((indirectCourseName) => {
          const hasEvidence =
            indirectEvidenceCourses[indirectCourseName].includes(studentId);
          const checkmarkHTML = hasEvidence
            ? '<span class="checkmark" aria-label="Indirect evidence present">&#x2713;</span>'
            : '<span class="not-complete" aria-label="No indirect evidence">&mdash;</span>';

          return `<td class="course-result-cell indirect-evidence">${checkmarkHTML}</td>`;
        })
        .join('');

      return `
        <tr
          class="student-result-row"
          data-result-status="${status.key}"
          data-has-indirect="${hasIndirectEvidence ? 'yes' : 'no'}"
        >
          <td class="center student-info student-id-column">${escapeHTML(student.studentID)}</td>
          <td class="left student-info student-name-column">${escapeHTML(student.studentName)}</td>
          ${prerequisiteCompletionHTML}
          ${indirectEvidenceHTML}
          <td class="status-cell ${status.className}">${escapeHTML(status.text)}</td>
          <td class="details-cell">
            <button
              type="button"
              class="student-detail-button"
              data-student-id="${escapeHTML(studentId)}"
              aria-label="View prerequisite details for ${escapeHTML(student.studentName)}"
            >View</button>
          </td>
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
          <th scope="col" class="details-column-header" rowspan="2">Details</th>
        </tr>
        <tr>
          <th scope="col" class="center student-id-column">Student ID</th>
          <th scope="col" class="left student-name-column">Student Name</th>
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
    ${buildSummaryHTML(
      studentCount,
      prerequisiteNames,
      completeCount,
      missingCount,
      indirectCount
    )}
    ${buildFilterHTML(
      studentCount,
      prerequisiteNames,
      completeCount,
      missingCount,
      indirectCount
    )}
    <div id="wideTableNotice" class="wide-table-notice" hidden>
      <span>More prerequisite columns are available horizontally. Student ID and name stay visible while you scroll.</span>
      <div class="wide-table-actions" aria-label="Horizontal table controls">
        <button type="button" class="buttonSecondary wide-table-scroll-button" data-table-scroll="-1">Scroll left</button>
        <button type="button" class="buttonSecondary wide-table-scroll-button" data-table-scroll="1">Scroll right</button>
      </div>
    </div>
    <div
      class="outputTable"
      role="region"
      aria-label="Prerequisite results table. Scroll horizontally to view additional columns."
      tabindex="0"
    >
      ${tableElementHTML}
    </div>
  `;

  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = outputHTML;

  const rows = Array.from(
    document.querySelectorAll(`#${tableId} tbody tr`)
  );
  rows.forEach(colorCodeCells);

  initializeResultsInteractions();

  return outputHTML;
}
