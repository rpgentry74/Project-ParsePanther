import { getState, setIndirectPrerequisiteData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';

function cleanComparable(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sectionNumbersMatch(parsedValue, rosterValue) {
  const parsed = cleanComparable(parsedValue);
  const roster = cleanComparable(rosterValue);

  if (!parsed && !roster) {
    return true;
  }

  return parsed === roster;
}

function classContextMatches(parsed, rosterData) {
  return (
    cleanComparable(parsed.professor) === cleanComparable(rosterData.professor) &&
    cleanComparable(parsed.course) === cleanComparable(rosterData.course) &&
    sectionNumbersMatch(parsed.lecNum, rosterData.lecNum) &&
    sectionNumbersMatch(parsed.labNum, rosterData.labNum)
  );
}

export async function parseIndirectClassData() {
  const textbox = document.getElementById('indirectPrerequisiteData');
  const prerequisiteData = textbox.value;

  const parsedIndirectClassData = parseIndirectPrerequisiteData(prerequisiteData);

  if (!parsedIndirectClassData) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Unable to process indirect prerequisite data.',
      'bad'
    );

    textbox.value = '';
    return null;
  }

  const rosterData = getState().rosterData;

  if (!rosterData) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Class Roster data is required first.',
      'bad'
    );

    await showDialog(
      'Please paste and confirm the Class Roster before processing indirect prerequisite data.'
    );

    textbox.value = '';
    return null;
  }

  if (!classContextMatches(parsedIndirectClassData, rosterData)) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Indirect prerequisite data does not match the roster.',
      'bad'
    );

    await showDialog(
      `The indirect prerequisite data does not match the confirmed Class Roster:<br>
      <strong>Professor:</strong> ${parsedIndirectClassData.professor || 'N/A'} vs ${rosterData.professor || 'N/A'}<br>
      <strong>Course:</strong> ${parsedIndirectClassData.course || 'N/A'} vs ${rosterData.course || 'N/A'}<br>
      <strong>LEC Number:</strong> ${parsedIndirectClassData.lecNum || 'N/A'} vs ${rosterData.lecNum || 'N/A'}<br>
      <strong>LAB Number:</strong> ${parsedIndirectClassData.labNum || 'N/A'} vs ${rosterData.labNum || 'N/A'}`
    );

    textbox.value = '';
    return null;
  }

  setIndirectPrerequisiteData(parsedIndirectClassData);

  updateStatusIndicator(
    'indirectPrerequisiteStatus',
    'Indirect prerequisite data processed successfully.',
    'good'
  );

  return parsedIndirectClassData;
}

function parseIndirectPrerequisiteData(prerequisiteData) {
  try {
    const source = String(prerequisiteData || '')
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .trim();

    if (!source) {
      throw new Error('No indirect prerequisite data was provided.');
    }

    if (!/Indirect Prerequisite Checker/i.test(source)) {
      throw new Error('This does not appear to be an Indirect Prerequisite Checker page.');
    }

    let professor = null;
    let course = null;
    let lecNum = null;
    let labNum = null;

    const professorMatch = source.match(/Professor:\s+([^\n]+)/i);
    if (professorMatch) {
      professor = professorMatch[1].replace(/\s+/g, ' ').trim();
    }

    if (!professor) {
      throw new Error('Professor information not found.');
    }

    const courseMatch = source.match(/Course:\s+([^\n]+)/i);
    if (courseMatch) {
      course = courseMatch[1].replace(/\s+/g, ' ').trim();
    }

    if (!course) {
      throw new Error('Course information not found.');
    }

    const meetingMatches = source.matchAll(
      /(LEC|LAB)\s*(?:-\s*|\(\s*)(\d{5})/gi
    );

    for (const match of meetingMatches) {
      const type = match[1].toUpperCase();

      if (type === 'LEC' && !lecNum) {
        lecNum = match[2];
      }

      if (type === 'LAB' && !labNum) {
        labNum = match[2];
      }
    }

    const sectionMatch = source.match(
      /LIST OF STUDENTS WHO HAVE COMPLETED THE PREREQUISITE COURSES INDIRECTLY([\s\S]+)$/i
    );

    const legacySectionMatch = source.match(
      /PREREQUISITE COURSES INDIRECTLY([\s\S]+)$/i
    );

    const prerequisiteSection =
      sectionMatch?.[1] ||
      legacySectionMatch?.[1] ||
      null;

    if (!prerequisiteSection) {
      throw new Error(
        'The indirect prerequisite results section was not recognized.'
      );
    }

    const prerequisiteCourses = {};
    const courseHeaderPattern =
      /^([A-Z]{2,5}\s+\d{3}[A-Z]?)(?:\s+\(formerly\s+[^)]+\))?\s*:\s*$/i;

    let currentPrerequisite = null;

    for (const rawLine of prerequisiteSection.split('\n')) {
      const line = rawLine.trim();

      if (!line) {
        continue;
      }

      if (/^Class rosters were last updated/i.test(line)) {
        break;
      }

      const courseHeaderMatch = line.match(courseHeaderPattern);

      if (courseHeaderMatch) {
        currentPrerequisite = courseHeaderMatch[1]
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

        prerequisiteCourses[currentPrerequisite] =
          prerequisiteCourses[currentPrerequisite] || [];

        continue;
      }

      if (!currentPrerequisite || !rawLine.includes('\t')) {
        continue;
      }

      const columns = rawLine.split('\t').map((column) => column.trim());
      const studentID = columns[2] || '';

      if (/^\d{6,8}$/.test(studentID)) {
        prerequisiteCourses[currentPrerequisite].push(studentID);
      }
    }

    if (!Object.keys(prerequisiteCourses).length) {
      throw new Error(
        'The indirect prerequisite section was found, but no prerequisite course headings were recognized.'
      );
    }

    return {
      professor,
      course,
      lecNum,
      labNum,
      prerequisiteCourses,
    };
  } catch (error) {
    console.error(
      'Error occurred while parsing indirect prerequisite data:',
      error.message
    );

    showDialog(
      `ParsePanther could not safely determine the indirect prerequisites from this page.<br><br><strong>Reason:</strong> ${error.message}<br><br>No prerequisite determination was made.`
    );

    return null;
  }
}
