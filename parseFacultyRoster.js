// parseFacultyRoster.js

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

function findLineIndex(lines, predicate) {
  return lines.findIndex((line) => predicate(line));
}

function extractSameLineValue(lines, label) {
  const labelLower = label.toLowerCase();

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (trimmed.toLowerCase().startsWith(labelLower)) {
      const value = trimmed.slice(label.length);
      const cleaned = cleanValue(value);

      if (cleaned) {
        return cleaned;
      }
    }
  }

  return null;
}

function parseMeetings(lines) {
  const startIndex = findLineIndex(lines, (line) => /^Meetings:\s*$/i.test(line.trim()));
  const endIndex = findLineIndex(lines, (line) => /^Term:\s*/i.test(line.trim()));

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

function parseStudents(lines) {
  const headerIndex = findLineIndex(
    lines,
    (line) =>
      line.includes('Student Name') &&
      line.includes('ID Num') &&
      line.includes('Add Date') &&
      line.includes('Attendance / Notes')
  );

  if (headerIndex < 0) {
    throw new Error('Faculty roster student header not found.');
  }

  const droppedIndex = lines.findIndex(
    (line, index) =>
      index > headerIndex &&
      /^Dropped Students(?:\t|$)/i.test(line.trim())
  );

  const rosterLines = lines.slice(
    headerIndex + 1,
    droppedIndex > headerIndex ? droppedIndex : undefined
  );

  const students = [];

  for (let i = 0; i < rosterLines.length; i++) {
    const nameMatch = rosterLines[i].match(/^\s*\d+\.\s*\t(.+?)(?:\t.*)?$/);

    if (!nameMatch) {
      continue;
    }

    const studentName = cleanStudentName(nameMatch[1]);

    if (!studentName) {
      continue;
    }

    let studentID = null;

    for (let offset = 1; offset <= 2 && i + offset < rosterLines.length; offset++) {
      const idMatch = rosterLines[i + offset].match(/^\s*(\d{6,8})(?:\t|\s|$)/);

      if (idMatch) {
        studentID = idMatch[1];
        i += offset;
        break;
      }

      if (/^\s*\d+\.\s*\t/.test(rosterLines[i + offset])) {
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

  if (!students.length) {
    throw new Error('No active students were found in the Faculty roster.');
  }

  return students;
}

export function parseFacultyRoster(source) {
  const lines = source.split('\n');

  const professor = extractSameLineValue(lines, 'Professor:');
  const course = extractSameLineValue(lines, 'Course:');

  if (!professor) {
    throw new Error('Professor information was not found in the Faculty roster.');
  }

  if (!course) {
    throw new Error('Course information was not found in the Faculty roster.');
  }

  const { lecNum, labNum } = parseMeetings(lines);
  const studentRoster = parseStudents(lines);

  return {
    professor,
    course,
    lecNum,
    labNum,
    studentRoster,
  };
}
