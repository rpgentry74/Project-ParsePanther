// rosterParser.js
import { parseFacultyRoster } from './parseFacultyRoster.js';
import { parseAdminRoster } from './parseAdminRoster.js';

export function normalizeRosterSource(rawText) {
  return String(rawText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function detectRosterVariant(rawText) {
  const source = normalizeRosterSource(rawText);

  const hasAdminCurrentStudents = /^Current Students\s*$/im.test(source);
  const hasAdminWaitList = /^Wait List\s*$/im.test(source);
  const hasAdminNavigation = /^Admin Rosters\s*$/im.test(source);
  const hasAdminTitle = /^Class Rosters\s*$/im.test(source);

  const hasFacultyStudentHeader =
    /^#\tStudent Name\tID Num\tAdd Date\tAttendance \/ Notes\s*$/im.test(source);
  const hasFacultyDroppedHeader =
    /^Dropped Students\tDrop Date \(reason\)\s*$/im.test(source);
  const hasFacultyTitle = /^Class Roster\s*$/im.test(source);

  const adminSignals = [
    hasAdminCurrentStudents,
    hasAdminWaitList,
    hasAdminNavigation,
    hasAdminTitle,
  ].filter(Boolean).length;

  const facultySignals = [
    hasFacultyStudentHeader,
    hasFacultyDroppedHeader,
    hasFacultyTitle,
  ].filter(Boolean).length;

  if (
    hasAdminCurrentStudents &&
    hasAdminWaitList &&
    adminSignals > facultySignals
  ) {
    return 'admin';
  }

  if (
    hasFacultyStudentHeader &&
    facultySignals > adminSignals
  ) {
    return 'faculty';
  }

  return 'unknown';
}

export function parseRosterText(rawText) {
  const source = normalizeRosterSource(rawText);
  const variant = detectRosterVariant(source);

  if (!source) {
    return {
      ok: false,
      variant: 'unknown',
      code: 'EMPTY_ROSTER',
      message: 'No roster data was provided.',
    };
  }

  if (variant === 'unknown') {
    return {
      ok: false,
      variant,
      code: 'UNKNOWN_ROSTER_FORMAT',
      message:
        'ParsePanther could not identify this as a supported Faculty or Admin roster format.',
    };
  }

  try {
    const parsed =
      variant === 'faculty'
        ? parseFacultyRoster(source)
        : parseAdminRoster(source);

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
      code: 'ROSTER_PARSE_FAILED',
      message: error.message,
    };
  }
}
