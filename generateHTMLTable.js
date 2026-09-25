// generateHTMLTable.js
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';
import { mergePrerequisiteData } from './prerequisiteDataUtils.js';
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

  const classAttribute = className
    ? ` class="${className}"`
    : '';

  return `<th scope="col"${classAttribute}>${escapeHTML(courseName)}${aliasHTML}${labelHTML}</th>`;
}

function buildStatus(prerequisiteNames, prerequisiteCourses, studentId) {
  if (prerequisiteNames.length === 0) {
    return {
      key: 'neutral',
      className: 'status-neutral',
      text: 'No prerequisites evaluated',
      missingCount: 0,
    };
  }

  const completed = prerequisiteNames.filter((prerequisite) =>
    prerequisiteCourses[prerequisite].includes(studentId)
  ).length;
  const missing = prerequisiteNames.length - completed;

  if (missing === 0) {
    return {
      key: 'complete',
      className: 'status-complete',
      text: 'All prerequisites complete',
      missingCount: 0,
    };
  }

  return {
    key: 'missing',
    className: 'status-missing',
    text: `Missing ${missing} prerequisite${missing === 1 ? '' : 's'}`,
    missingCount: missing,
  };
}

function hasIndirectEvidence(
  studentId,
  prerequisiteNames,
  prerequisiteEvidenceSources,
  indirectEvidenceCourses
) {
  const supportsOfficialPrerequisite = prerequisiteNames.some(
    (prerequisite) =>
      (prerequisiteEvidenceSources[prerequisite]?.[studentId] || [])
        .some((entry) => entry.source === 'indirect')
  );

  if (supportsOfficialPrerequisite) {
    return true;
  }

  return Object.values(indirectEvidenceCourses)
    .some((studentIds) => studentIds.includes(studentId));
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

  const {
    prerequisiteCourses,
    courseAliases,
    prerequisiteEvidenceSources,
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

  const studentModels = rosterData.studentRoster.map((student) => {
    const studentId = String(student.studentID).trim();
    const status = buildStatus(
      prerequisiteNames,
      prerequisiteCourses,
      studentId
    );

    return {
      student,
      studentId,
      status,
      hasIndirect: hasIndirectEvidence(
        studentId,
        prerequisiteNames,
        prerequisiteEvidenceSources,
        indirectEvidenceCourses
      ),
    };
  });

  const completeCount = studentModels.filter(
    ({ status }) => status.key === 'complete'
  ).length;
  const missingCount = studentModels.filter(
    ({ status }) => status.key === 'missing'
  ).length;
  const indirectCount = studentModels.filter(
    ({ hasIndirect }) => hasIndirect
  ).length;

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
    .map(({ student, studentId, status, hasIndirect }) => {
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
        .map((indirectCourseName) => {
          const hasEvidence =
            indirectEvidenceCourses[indirectCourseName].includes(studentId);
          const checkmarkHTML = hasEvidence
            ? '<span class="checkmark" aria-label="Indirect evidence present">&#x2713;</span>'
            : '<span class="not-complete" aria-label="No indirect evidence">&mdash;</span>';

          return `<td class="indirect-evidence">${checkmarkHTML}</td>`;
        })
        .join('');

      return `
        <tr
          class="student-result-row"
          data-result-status="${status.key}"
          data-has-indirect="${hasIndirect ? 'yes' : 'no'}"
        >
          <td class="center student-info">${escapeHTML(student.studentID)}</td>
          <td class="left student-info">${escapeHTML(student.studentName)}</td>
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

  initializeResultsInteractions();

  return outputHTML;
}
