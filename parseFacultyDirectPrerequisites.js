// parseFacultyDirectPrerequisites.js

function cleanValue(value) {
  return String(value || '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSameLineValue(lines, label) {
  const labelLower = label.toLowerCase();

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (!trimmed.toLowerCase().startsWith(labelLower)) {
      continue;
    }

    const value = cleanValue(trimmed.slice(label.length));

    if (value) {
      return value;
    }
  }

  return null;
}

function parseMeetings(lines) {
  const startIndex = lines.findIndex((line) => /^Meetings:\s*$/i.test(line.trim()));
  const endIndex = lines.findIndex((line) => /^Term:\s*/i.test(line.trim()));

  const meetingLines =
    startIndex >= 0
      ? lines.slice(startIndex + 1, endIndex > startIndex ? endIndex : undefined)
      : lines;

  let lecNum = null;
  let labNum = null;

  for (const line of meetingLines) {
    const match = line.match(/\b(LEC|LAB)\s*-\s*(\d{5})\b/i);

    if (!match) {
      continue;
    }

    if (match[1].toUpperCase() === 'LEC' && !lecNum) {
      lecNum = match[2];
    }

    if (match[1].toUpperCase() === 'LAB' && !labNum) {
      labNum = match[2];
    }
  }

  return { lecNum, labNum };
}

function parseAliases(aliasText) {
  if (!aliasText) {
    return [];
  }

  return aliasText
    .split(',')
    .map((alias) => cleanValue(alias).toUpperCase())
    .filter(Boolean);
}

function parsePrerequisiteSections(lines) {
  const sectionIndex = lines.findIndex(
    (line) =>
      cleanValue(line).toUpperCase() ===
      'PREREQUISITE COURSES COMPLETED WITHIN LOS RIOS'
  );

  if (sectionIndex < 0) {
    throw new Error('Direct prerequisite section heading was not found.');
  }

  const courseHeaderPattern =
    /^([A-Z]{2,5}\s+\d{3}[A-Z]?)(?:\s+\(formerly\s+([^)]+)\))?\s*:?\s*$/i;

  const prerequisiteCourses = {};
  const courseAliases = {};
  let currentCourse = null;

  for (let i = sectionIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    const courseMatch = trimmed.match(courseHeaderPattern);

    if (courseMatch) {
      currentCourse = cleanValue(courseMatch[1]).toUpperCase();
      prerequisiteCourses[currentCourse] = prerequisiteCourses[currentCourse] || [];

      const aliases = parseAliases(courseMatch[2]);

      if (aliases.length) {
        courseAliases[currentCourse] = aliases;
      }

      continue;
    }

    if (!currentCourse || !rawLine.includes('\t')) {
      continue;
    }

    const columns = rawLine.split('\t').map((column) => column.trim());

    if (columns.length < 3) {
      continue;
    }

    const studentID = columns[2];

    if (/^\d{6,8}$/.test(studentID)) {
      prerequisiteCourses[currentCourse].push(studentID);
    }
  }

  if (!Object.keys(prerequisiteCourses).length) {
    throw new Error(
      'The direct prerequisite section was found, but no prerequisite course headings were recognized.'
    );
  }

  return {
    prerequisiteCourses,
    courseAliases,
  };
}

export function parseFacultyDirectPrerequisites(source) {
  const lines = source.split('\n');

  const professor = extractSameLineValue(lines, 'Professor:');
  const course = extractSameLineValue(lines, 'Course:');

  if (!professor) {
    throw new Error('Professor information was not found in the Faculty prerequisite page.');
  }

  if (!course) {
    throw new Error('Course information was not found in the Faculty prerequisite page.');
  }

  const { lecNum, labNum } = parseMeetings(lines);
  const { prerequisiteCourses, courseAliases } = parsePrerequisiteSections(lines);

  return {
    professor,
    course,
    lecNum,
    labNum,
    prerequisiteCourses,
    courseAliases,
  };
}
