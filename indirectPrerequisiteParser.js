// indirectPrerequisiteParser.js
import { parseFacultyIndirectPrerequisites } from './parseFacultyIndirectPrerequisites.js';

export function normalizeIndirectPrerequisiteSource(rawText) {
  return String(rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function detectIndirectPrerequisiteVariant(rawText) {
  const source = normalizeIndirectPrerequisiteSource(rawText);

  const hasFacultyPageTitle =
    /^Indirect Prerequisite Checker \[Experimental Service\]\s*$/im.test(source);
  const hasIndirectHeading =
    /^INDIRECT PREQUISITES\s*$/im.test(source);
  const hasFacultyResultsHeading =
    /^LIST OF STUDENTS WHO HAVE COMPLETED THE PREREQUISITE COURSES INDIRECTLY\s*$/im.test(
      source
    );

  if (hasFacultyPageTitle && hasIndirectHeading && hasFacultyResultsHeading) {
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
        'ParsePanther could not identify this as a supported indirect prerequisite format. The Faculty format is supported; the Admin format still needs to be captured.',
    };
  }

  try {
    const parsed = parseFacultyIndirectPrerequisites(source);

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
