// indirectPrerequisiteParser.js
import { parseFacultyIndirectPrerequisites } from './parseFacultyIndirectPrerequisites.js';
import { parseAdminIndirectPrerequisites } from './parseAdminIndirectPrerequisites.js';

export function normalizeIndirectPrerequisiteSource(rawText) {
  return String(rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function detectIndirectPrerequisiteVariant(rawText) {
  const source = normalizeIndirectPrerequisiteSource(rawText);

  const hasAdminClassList = /^Admin Class List\s*$/im.test(source);
  const hasAdminPageTitle = /^Indirect Prerequisite Checker\s*$/im.test(source);
  const hasAdminSectionLabel = /^Indirect Prerequisites:\s*$/im.test(source);
  const hasAdminResultsHeading =
    /^List of students who have completed the [A-Z]{2,5}\s+[A-Z]?\d{3,4}[A-Z]? prerequisite courses indirectly\s*$/im.test(
      source
    );

  const hasFacultyPageTitle =
    /^Indirect Prerequisite Checker \[Experimental Service\]\s*$/im.test(source);
  const hasFacultySectionLabel =
    /^INDIRECT PREQUISITES\s*$/im.test(source);
  const hasFacultyResultsHeading =
    /^LIST OF STUDENTS WHO HAVE COMPLETED THE PREREQUISITE COURSES INDIRECTLY\s*$/im.test(
      source
    );

  const adminSignals = [
    hasAdminClassList,
    hasAdminPageTitle,
    hasAdminSectionLabel,
    hasAdminResultsHeading,
  ].filter(Boolean).length;

  const facultySignals = [
    hasFacultyPageTitle,
    hasFacultySectionLabel,
    hasFacultyResultsHeading,
  ].filter(Boolean).length;

  if (
    hasAdminClassList &&
    hasAdminResultsHeading &&
    adminSignals > facultySignals
  ) {
    return 'admin';
  }

  if (
    hasFacultyPageTitle &&
    hasFacultyResultsHeading &&
    facultySignals > adminSignals
  ) {
    return 'faculty';
  }

  return 'unknown';
}

export function parseIndirectPrerequisiteText(rawText) {
  const source = normalizeIndirectPrerequisiteSource(rawText);

  if (!source) {
    return {
      ok: false,
      variant: 'unknown',
      code: 'EMPTY_INDIRECT_PREREQUISITE',
      message: 'No indirect prerequisite data was provided.',
    };
  }

  const variant = detectIndirectPrerequisiteVariant(source);

  if (variant === 'unknown') {
    return {
      ok: false,
      variant,
      code: 'UNKNOWN_INDIRECT_PREREQUISITE_FORMAT',
      message:
        'ParsePanther could not identify this as a supported Faculty or Admin indirect prerequisite format.',
    };
  }

  try {
    const parsed =
      variant === 'faculty'
        ? parseFacultyIndirectPrerequisites(source)
        : parseAdminIndirectPrerequisites(source);

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
      code: 'INDIRECT_PREREQUISITE_PARSE_FAILED',
      message: error.message,
    };
  }
}
