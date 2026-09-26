// studentMessage.js
import { formatPrerequisiteDisplayName } from './prerequisiteDataUtils.js';

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

export function buildStudentMessage(
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
    .map((prerequisite) =>
      `- ${formatPrerequisiteDisplayName(
        prerequisite,
        courseAliases[prerequisite] || [],
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
    `I reviewed the prerequisite information available for ${courseName}. The following prerequisite${missingPrerequisites.length === 1 ? '' : 's'} do not appear as completed in the LRCCD Prerequisite Checker:`,
    '',
    missingList,
    '',
    'If you believe this information is incorrect or you have documentation that may affect your prerequisite status, please contact me.',
    '',
    signature,
  ].join('\n');
}
