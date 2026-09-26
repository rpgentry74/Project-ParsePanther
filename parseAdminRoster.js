// parseAdminRoster.js

function cleanValue(value) {
  return String(value || '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanStudentName(value) {
  return cleanValue(value)
    .replace(/\s*\*+\s*$/, '')
    .trim();
}

function nextNonEmptyLine(lines, startIndex) {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const value = cleanValue(lines[i]);

    if (value) {
      return value;
    }
  }

  return null;
}

function extractLabeledValue(lines, label) {
  const labelLower = label.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();

    if (!trimmed.toLowerCase().startsWith(labelLower)) {
      continue;
    }

    const sameLineValue = cleanValue(trimmed.slice(label.length));

    if (sameLineValue) {
      return sameLineValue;
    }

    return nextNonEmptyLine(lines, i);
  }

  return null;
}

function parseMeetings(lines) {
  const startIndex = lines.findIndex((line) => /^Meetings:\s*$/i.test(line.trim()));
  const endIndex = lines.findIndex((line) => /^Term:\s*$/i.test(line.trim()));

  const meetingLines =
    startIndex >= 0
      ? lines.slice(startIndex + 1, endIndex > startIndex ? endIndex : undefined)
      : lines;

  let lecNum = null;
  let labNum = null;

  for (const line of meetingLines) {
    const match = line.match(/\b(LEC|LAB)\s*\(\s*(\d{5})\s*\)/i);

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

function findSectionEndIndex(lines, startIndex, endLabels) {
  const normalizedLabels = endLabels.map((label) => label.toLowerCase());

  for (let i = startIndex + 1; i < lines.length; i++) {
    const value = cleanValue(lines[i]).toLowerCase();

    if (normalizedLabels.includes(value)) {
      return i;
    }
  }

  return -1;
}

function parseStudentSection(lines, startLabel, endLabels) {
  const startIndex = lines.findIndex(
    (line) => cleanValue(line).toLowerCase() === startLabel.toLowerCase()
  );

  if (startIndex < 0) {
    return [];
  }

  const endIndex = findSectionEndIndex(lines, startIndex, endLabels);
  const sectionLines = lines.slice(
    startIndex + 1,
    endIndex > startIndex ? endIndex : undefined
  );

  if (
    sectionLines.some((line) =>
      /^No Waitlist Students$/i.test(cleanValue(line))
    )
  ) {
    return [];
  }

  const students = [];

  for (let i = 0; i < sectionLines.length; i++) {
    const nameMatch = sectionLines[i].match(/^\s*\d+\.\s+(.+?)\s*$/);

    if (!nameMatch) {
      continue;
    }

    const studentName = cleanStudentName(nameMatch[1]);

    if (!studentName) {
      continue;
    }

    let studentID = null;

    for (
      let offset = 1;
      offset <= 3 && i + offset < sectionLines.length;
      offset++
    ) {
      const candidate = cleanValue(sectionLines[i + offset]);

      if (!candidate) {
        continue;
      }

      const idMatch = candidate.match(/^(\d{6,8})$/);

      if (idMatch) {
        studentID = idMatch[1];
        i += offset;
        break;
      }

      if (/^\d+\.\s+/.test(candidate)) {
        break;
      }
    }

    if (studentID) {
      students.push({
        studentName,
        studentID,
      });
    }
  }

  return students;
}

function deduplicateStudents(students) {
  const byId = new Map();

  for (const student of students) {
    if (!byId.has(student.studentID)) {
      byId.set(student.studentID, student);
    }
  }

  return Array.from(byId.values());
}

export function parseAdminRoster(source) {
  const lines = source.split('\n');

  const professor = extractLabeledValue(lines, 'Professor:');
  const course = extractLabeledValue(lines, 'Course:');

  if (!professor) {
    throw new Error('Professor information was not found in the Admin roster.');
  }

  if (!course) {
    throw new Error('Course information was not found in the Admin roster.');
  }

  const { lecNum, labNum } = parseMeetings(lines);

  const currentStudents = parseStudentSection(
    lines,
    'Current Students',
    ['Wait List', 'Drops']
  );

  const waitlistStudents = parseStudentSection(
    lines,
    'Wait List',
    ['Drops']
  );

  const studentRoster = deduplicateStudents([
    ...currentStudents,
    ...waitlistStudents,
  ]);

  if (!studentRoster.length) {
    throw new Error('No active or waitlisted students were found in the Admin roster.');
  }

  return {
    professor,
    course,
    lecNum,
    labNum,
    studentRoster,
  };
}
