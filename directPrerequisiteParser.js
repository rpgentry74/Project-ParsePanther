// directPrerequisiteParser.js
import { parseFacultyDirectPrerequisites } from './parseFacultyDirectPrerequisites.js';
import { parseAdminDirectPrerequisites } from './parseAdminDirectPrerequisites.js';

export function normalizeDirectPrerequisiteSource(rawText) {
  return String(rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function detectDirectPrerequisiteVariant(rawText) {
  const source = normalizeDirectPrerequisiteSource(rawText);

  const hasAdminClassList = /^Admin Class List\s*$/im.test(source);
  const hasAdminSectionTitle =
    /^[A-Z]{2,5}\s+[A-Z]?\d{3,4}[A-Z]?\s+Prerequisite Courses Completed Within Los Rios\s*$/im.test(
      source
    );
  const hasAdminStudentHeader =
    /^Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege\s*$/im.test(
      source
    );

  const hasFacultySectionTitle =
    /^PREREQUISITE COURSES COMPLETED WITHIN LOS RIOS\s*$/im.test(source);
  const hasFacultyOverview = /^Prerequisite Checking Overview\s*$/im.test(source);

  const adminSignals = [
    hasAdminClassList,
    hasAdminSectionTitle,
    hasAdminStudentHeader,
  ].filter(Boolean).length;

  const facultySignals = [
    hasFacultySectionTitle,
    hasFacultyOverview,
  ].filter(Boolean).length;

  if (
    hasAdminSectionTitle &&
    (hasAdminClassList || hasAdminStudentHeader) &&
    adminSignals > facultySignals
  ) {
    return 'admin';
  }

  if (
    hasFacultySectionTitle &&
    facultySignals > adminSignals
  ) {
    return 'faculty';
  }

  return 'unknown';
}

export function parseDirectPrerequisiteText(rawText) {
  const source = normalizeDirectPrerequisiteSource(rawText);

  if (!source) {
    return {
      ok: false,
      variant: 'unknown',
      code: 'EMPTY_DIRECT_PREREQUISITE',
      message: 'No direct prerequisite data was provided.',
    };
  }

  const variant = detectDirectPrerequisiteVariant(source);

  if (variant === 'unknown') {
    return {
      ok: false,
      variant,
      code: 'UNKNOWN_DIRECT_PREREQUISITE_FORMAT',
      message:
        'ParsePanther could not identify this as a supported Faculty or Admin direct prerequisite format.',
    };
  }

  try {
    const parsed =
      variant === 'faculty'
        ? parseFacultyDirectPrerequisites(source)
        : parseAdminDirectPrerequisites(source);

    return {
      ok: true,
      variant,
      data: {
        variant,
        ...parsed,
      },
    };
  } catch (error) {
    return {
      ok: false,
      variant,
      code: 'DIRECT_PREREQUISITE_PARSE_FAILED',
      message: error.message,
    };
  }
}
