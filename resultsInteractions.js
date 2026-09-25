// resultsInteractions.js
import { getState } from './state.js';
import {
  mergePrerequisiteData,
  formatPrerequisiteDisplayName,
} from './prerequisiteDataUtils.js';
import { recordDiagnostic } from './diagnostics.js';

let closeActiveStudentDetails = null;

function studentFirstName(studentName) {
  const value = String(studentName || '').trim();

  if (!value) {
    return '';
  }

  if (value.includes(',')) {
    return value
      .split(',')
      .slice(1)
      .join(',')
      .trim()
      .split(/\s+/)[0] || '';
  }

  return value.split(/\s+/)[0] || '';
}

function professorLastName(professorName) {
  const value = String(professorName || '').trim();

  if (!value) {
    return '';
  }

  if (value.includes(',')) {
    return value.split(',')[0].trim();
  }

  const parts = value.split(/\s+/);
  return parts[parts.length - 1] || '';
}

function buildStudentMessage(
  student,
  rosterData,
  missingPrerequisites,
  courseAliases
) {
  const firstName = studentFirstName(student.studentName);
  const lastName = professorLastName(rosterData.professor);
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
  const courseName = rosterData.course || 'this course';

  const missingList = missingPrerequisites
    .map((courseName) =>
      `- ${formatPrerequisiteDisplayName(
        courseName,
        courseAliases[courseName] || [],
        ' '
      )}`
    )
    .join('\n');

  const signature = lastName
    ? `Professor ${lastName}`
    : 'Professor';

  return [
    greeting,
    '',
    `I reviewed the prerequisite information available for ${courseName}. The following official prerequisite${missingPrerequisites.length === 1 ? '' : 's'} do not appear as completed in the LRCCD Prerequisite Checker:`,
    '',
    missingList,
    '',
    'If you believe this information is incorrect or you have documentation that may affect your prerequisite status, please contact me.',
    '',
    signature,
  ].join('\n');
}

function describeEvidence(entries = []) {
  if (!entries.length) {
    return 'Completed';
  }

  const hasDirect = entries.some((entry) => entry.source === 'direct');
  const indirectEntries = entries.filter((entry) => entry.source === 'indirect');

  if (hasDirect && indirectEntries.length) {
    return 'Completed. Direct and Indirect evidence are present.';
  }

  if (hasDirect) {
    return 'Completed. Listed in the Direct Prerequisite Checker.';
  }

  if (indirectEntries.length) {
    const courses = Array.from(
      new Set(indirectEntries.map((entry) => entry.course).filter(Boolean))
    );

    if (courses.length) {
      return `Completed through Indirect evidence (${courses.join(', ')}).`;
    }

    return 'Completed through Indirect evidence.';
  }

  return 'Completed';
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const fallback = document.createElement('textarea');
  fallback.value = text;
  fallback.setAttribute('readonly', '');
  fallback.style.position = 'fixed';
  fallback.style.opacity = '0';
  document.body.appendChild(fallback);
  fallback.select();
  document.execCommand('copy');
  fallback.remove();
}

function closeExistingStudentDetails() {
  if (closeActiveStudentDetails) {
    closeActiveStudentDetails();
  }
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;
  return element;
}

function buildOfficialPrerequisiteList(
  studentId,
  prerequisiteNames,
  prerequisiteCourses,
  courseAliases,
  prerequisiteEvidenceSources
) {
  const list = document.createElement('ul');
  list.className = 'student-detail-list';

  for (const prerequisite of prerequisiteNames) {
    const completed = prerequisiteCourses[prerequisite].includes(studentId);
    const item = document.createElement('li');
    const heading = createTextElement(
      'strong',
      '',
      formatPrerequisiteDisplayName(
        prerequisite,
        courseAliases[prerequisite] || [],
        ' '
      )
    );
    const detail = createTextElement(
      'span',
      completed ? 'detail-complete' : 'detail-missing',
      completed
        ? describeEvidence(
            prerequisiteEvidenceSources[prerequisite]?.[studentId] || []
          )
        : 'Missing from the available prerequisite evidence.'
    );

    item.appendChild(heading);
    item.appendChild(detail);
    list.appendChild(item);
  }

  return list;
}

function buildIndirectEvidenceList(
  studentId,
  indirectEvidenceCourses,
  indirectEvidenceAliases
) {
  const evidenceCourses = Object.keys(indirectEvidenceCourses)
    .filter((courseName) =>
      indirectEvidenceCourses[courseName].includes(studentId)
    );

  if (!evidenceCourses.length) {
    return createTextElement(
      'p',
      'detail-empty',
      'No additional indirect-only evidence is listed for this student.'
    );
  }

  const list = document.createElement('ul');
  list.className = 'student-detail-list student-detail-list-neutral';

  for (const courseName of evidenceCourses) {
    const item = document.createElement('li');
    const heading = createTextElement(
      'strong',
      '',
      formatPrerequisiteDisplayName(
        courseName,
        indirectEvidenceAliases[courseName] || [],
        ' '
      )
    );
    const detail = createTextElement(
      'span',
      'detail-neutral',
      'Informational Indirect Evidence. This course does not affect prerequisite status.'
    );

    item.appendChild(heading);
    item.appendChild(detail);
    list.appendChild(item);
  }

  return list;
}

function openStudentDetails(studentId) {
  closeExistingStudentDetails();
  recordDiagnostic('student-detail-opened');

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData) {
    return;
  }

  const student = rosterData.studentRoster.find(
    (candidate) => String(candidate.studentID).trim() === studentId
  );

  if (!student) {
    return;
  }

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
  const missingPrerequisites = prerequisiteNames.filter(
    (prerequisite) =>
      !prerequisiteCourses[prerequisite].includes(studentId)
  );

  const previouslyFocused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  const overlay = document.createElement('div');
  overlay.className = 'student-detail-overlay';

  const dialog = document.createElement('section');
  dialog.className = 'student-detail-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'studentDetailHeading');

  const header = document.createElement('div');
  header.className = 'student-detail-header';

  const headingBlock = document.createElement('div');
  headingBlock.appendChild(
    createTextElement('p', 'card-kicker', 'Student Detail')
  );

  const heading = createTextElement(
    'h2',
    '',
    student.studentName || 'Student'
  );
  heading.id = 'studentDetailHeading';
  headingBlock.appendChild(heading);
  headingBlock.appendChild(
    createTextElement(
      'p',
      'student-detail-id',
      `Student ID: ${student.studentID}`
    )
  );

  const closeButton = createTextElement(
    'button',
    'buttonSecondary',
    'Close'
  );
  closeButton.type = 'button';

  header.appendChild(headingBlock);
  header.appendChild(closeButton);
  dialog.appendChild(header);

  const officialSection = document.createElement('section');
  officialSection.className = 'student-detail-section';
  officialSection.appendChild(
    createTextElement('h3', '', 'Official Prerequisites')
  );

  if (prerequisiteNames.length) {
    officialSection.appendChild(
      buildOfficialPrerequisiteList(
        studentId,
        prerequisiteNames,
        prerequisiteCourses,
        courseAliases,
        prerequisiteEvidenceSources
      )
    );
  } else {
    officialSection.appendChild(
      createTextElement(
        'p',
        'detail-empty',
        'No official prerequisites were evaluated.'
      )
    );
  }

  dialog.appendChild(officialSection);

  const indirectSection = document.createElement('section');
  indirectSection.className = 'student-detail-section';
  indirectSection.appendChild(
    createTextElement('h3', '', 'Additional Indirect Evidence')
  );
  indirectSection.appendChild(
    buildIndirectEvidenceList(
      studentId,
      indirectEvidenceCourses,
      indirectEvidenceAliases
    )
  );
  dialog.appendChild(indirectSection);

  if (missingPrerequisites.length) {
    const messageSection = document.createElement('section');
    messageSection.className = 'student-detail-section copy-message-section';
    messageSection.appendChild(
      createTextElement('h3', '', 'Student Message')
    );
    messageSection.appendChild(
      createTextElement(
        'p',
        'detail-help',
        'Review and edit the message before copying it.'
      )
    );

    const message = document.createElement('textarea');
    message.className = 'student-message-text';
    message.rows = 10;
    message.value = buildStudentMessage(
      student,
      rosterData,
      missingPrerequisites,
      courseAliases
    );
    message.setAttribute(
      'aria-label',
      `Editable message for ${student.studentName}`
    );

    const messageActions = document.createElement('div');
    messageActions.className = 'student-message-actions';

    const copyButton = createTextElement(
      'button',
      'buttonPrimary',
      'Copy Message'
    );
    copyButton.type = 'button';

    const copyStatus = createTextElement(
      'span',
      'copy-message-status',
      ''
    );
    copyStatus.setAttribute('role', 'status');
    copyStatus.setAttribute('aria-live', 'polite');

    copyButton.addEventListener('click', async () => {
      try {
        await copyText(message.value);
        recordDiagnostic('student-message-copied');
        copyStatus.textContent = 'Message copied.';
      } catch {
        copyStatus.textContent =
          'Unable to copy automatically. Select the message and copy it manually.';
      }
    });

    messageActions.appendChild(copyButton);
    messageActions.appendChild(copyStatus);
    messageSection.appendChild(message);
    messageSection.appendChild(messageActions);
    dialog.appendChild(messageSection);
  }

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  function focusableElements() {
    return Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), textarea:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'
      )
    );
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = focusableElements();

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeDialog() {
    if (!overlay.isConnected) {
      return;
    }

    overlay.remove();
    document.removeEventListener('keydown', handleKeydown);

    if (closeActiveStudentDetails === closeDialog) {
      closeActiveStudentDetails = null;
    }

    if (previouslyFocused?.isConnected) {
      previouslyFocused.focus();
    }
  }

  closeActiveStudentDetails = closeDialog;
  closeButton.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeDialog();
    }
  });
  document.addEventListener('keydown', handleKeydown);
  closeButton.focus();
}

function initializeFilters() {
  const table = document.getElementById('mergedTable');
  const buttons = Array.from(
    document.querySelectorAll('.result-filter-button')
  );
  const status = document.getElementById('resultFilterStatus');

  if (!table || !buttons.length) {
    return;
  }

  const rows = Array.from(
    table.querySelectorAll('tbody tr.student-result-row')
  );

  function applyFilter(filter) {
    let visibleCount = 0;

    recordDiagnostic('results-filter-applied', {
      status: filter,
    });

    for (const row of rows) {
      const matches =
        filter === 'all' ||
        (filter === 'complete' &&
          row.dataset.resultStatus === 'complete') ||
        (filter === 'missing' &&
          row.dataset.resultStatus === 'missing') ||
        (filter === 'indirect' &&
          row.dataset.hasIndirect === 'yes');

      row.hidden = !matches;

      if (matches) {
        visibleCount += 1;
      }
    }

    for (const button of buttons) {
      button.setAttribute(
        'aria-pressed',
        button.dataset.filter === filter ? 'true' : 'false'
      );
    }

    if (status) {
      status.textContent =
        visibleCount === rows.length
          ? `Showing all ${rows.length} students.`
          : `Showing ${visibleCount} of ${rows.length} students.`;
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      applyFilter(button.dataset.filter || 'all');
    });
  }

  applyFilter('all');
}

function initializeStudentDetails() {
  const buttons = document.querySelectorAll('.student-detail-button');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      openStudentDetails(String(button.dataset.studentId || '').trim());
    });
  }
}

export function initializeResultsInteractions() {
  initializeFilters();
  initializeStudentDetails();
}
