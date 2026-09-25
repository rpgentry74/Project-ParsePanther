import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

function normalize(str) {
  return String(str || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

function cleanString(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

// Signals that this is a Prerequisite/Indirect page (handles split lines and variants)
const PREREQ_SIGNALS = [
  /Prerequisite\s*Checker/i,
  /Indirect\s*Prerequisite\s*Checker/i,
  /Prerequisite\s*Checking\s*Overview/i,
  /Known\s*Limitations/i,
  /PREREQUISITE\s+COURSES\s+COMPLETED\s+WITHIN\s+LOS\s+RIOS/i,
];

// Header that starts the prereq listing block (admin or faculty)
const PREREQ_SECTION_HEADER = /Prerequisite\s+Courses\s+Completed\s+Within\s+Los\s+Rios/i;

// Course subsection header like "MET 256:" or "MATH 351A:"
const COURSE_HEADER_GLOBAL_RE = /^\s*([A-Z]{2,5}\s*\d{3}[A-Z]?)\s*:?\s*$/gm;

// Student row (tab-delimited preferred; graceful fallback to multi-space)
const ID_RE = /\b(\d{6,8})\b/;

export function parseClassData() {
  return new Promise((resolve) => {
    const raw = document.getElementById('prerequisiteData').value;
    const prerequisiteData = normalize(raw);
    const prerequisiteStatus = document.getElementById('prerequisiteStatus');

    // 1) Is this a Prerequisite Checker page at all?
    const looksLikePrereq = PREREQ_SIGNALS.some((re) => re.test(prerequisiteData));

    if (looksLikePrereq && /(Professor|Instructor)/i.test(prerequisiteData)) {
      const parsed = parsePrerequisiteData(prerequisiteData);
      if (!parsed) {
        // parsePrerequisiteData already showed a dialog with the reason
        prerequisiteStatus.innerText = 'Unable to parse prerequisite data.';
        prerequisiteStatus.classList.remove('status-good', 'status-default');
        prerequisiteStatus.classList.add('status-bad');
        return resolve(null);
      }

      const { professor, course, lecNum, labNum, prerequisiteCourses, meta } = parsed;
      const rosterData = getState().rosterData || {};

      // Compare against roster to prevent cross-course pastes
      const doLecNumsMatch =
        (lecNum == null && rosterData.lecNum == null) ||
        (lecNum && rosterData.lecNum && lecNum.trim().toLowerCase() === rosterData.lecNum.trim().toLowerCase());

      const doLabNumsMatch =
        (labNum == null && rosterData.labNum == null) ||
        (labNum && rosterData.labNum && labNum.trim().toLowerCase() === rosterData.labNum.trim().toLowerCase());

      if (
        professor && rosterData.professor &&
        course && rosterData.course &&
        professor.trim().toLowerCase() === (rosterData.professor || '').trim().toLowerCase() &&
        course.trim().toLowerCase() === (rosterData.course || '').trim().toLowerCase() &&
        doLecNumsMatch && doLabNumsMatch
      ) {
        // Decide the user-facing message based on sections/rows
        const courseKeys = Object.keys(prerequisiteCourses || {});
        const hasSections = courseKeys.length > 0;
        const totalRows = courseKeys.reduce((sum, k) => sum + (prerequisiteCourses[k]?.length || 0), 0);

        setState({ prerequisiteData: parsed });

        if (!hasSections) {
          // Case A: NO SECTIONS (likely no direct prereqs defined in LRCCD)
          prerequisiteStatus.innerText = 'No direct prerequisite sections were found for this course.';
          prerequisiteStatus.classList.remove('status-bad', 'status-good');
          prerequisiteStatus.classList.add('status-default');
          showDialog(
            `No direct prerequisite sections were found for <strong>${cleanString(course)}</strong>.<br><br>` +
            `• This usually means the course has no direct prerequisites listed in LRCCD for this term.<br>` +
            `• If you expected prerequisites, try the <strong>Indirect Prerequisite Checker</strong> or verify in the catalog.`
          );
          return resolve(parsed);
        }

        if (hasSections && totalRows === 0) {
          // Case B: SECTIONS present, but ZERO student rows (we may not have a live sample, but handle it)
          prerequisiteStatus.innerText = 'Prerequisite sections found, but no matching students were listed.';
          prerequisiteStatus.classList.remove('status-bad', 'status-good');
          prerequisiteStatus.classList.add('status-default');
          showDialog(
            `Prerequisite sections were found for <strong>${cleanString(course)}</strong>, but no matching students appear under them.<br><br>` +
            `• Students may have satisfied the requirement via transfer/waiver (not shown here).<br>` +
            `• Consider checking the <strong>Indirect Prerequisite Checker</strong>.`
          );
          return resolve(parsed);
        }

        // Case C: Normal success (sections + at least one student row)
        prerequisiteStatus.innerText = 'Prerequisite data processed successfully.';
        prerequisiteStatus.classList.remove('status-bad', 'status-default');
        prerequisiteStatus.classList.add('status-good');
        return resolve(parsed);

      } else {
        // Mismatch between pasted prereq page and roster context
        showDialog(
          `The prerequisite data doesn't match the roster data: <br>
          <strong>Professor:</strong> ${professor || 'N/A'} vs ${rosterData.professor || 'N/A'} <br>
          <strong>Course:</strong> ${course || 'N/A'} vs ${rosterData.course || 'N/A'}<br>
          <strong>LEC Number:</strong> ${lecNum || 'N/A'} vs ${rosterData.lecNum || 'N/A'}<br>
          <strong>LAB Number:</strong> ${labNum || 'N/A'} vs ${rosterData.labNum || 'N/A'}`,
          true
        ).then(() => {
          document.getElementById('prerequisiteData').value = '';
          setState({ prerequisiteData: null });
          prerequisiteStatus.innerText = 'Prerequisite data processing cancelled by user.';
          prerequisiteStatus.classList.remove('status-good', 'status-default');
          prerequisiteStatus.classList.add('status-bad');
          resolve(null);
        });
      }
      return;
    }

    // Not a prereq page — identify wrong field paste
    let checkerType;
    if (/Class\s*Rosters?/i.test(prerequisiteData) && /(Professor|Instructor)/i.test(prerequisiteData)) {
      checkerType = 'Class Roster';
    } else if (/Indirect\s*Prerequisite\s*Checker/i.test(prerequisiteData) && /(Professor|Instructor)/i.test(prerequisiteData)) {
      checkerType = 'Indirect Prerequisite';
    }

    if (checkerType) {
      prerequisiteStatus.innerText = 'Invalid data provided. Please paste the Prerequisite data.';
      prerequisiteStatus.classList.remove('status-good', 'status-default');
      prerequisiteStatus.classList.add('status-bad');
      showDialog(`It looks like you are trying to paste ${checkerType} data into the Prerequisite field.`)
        .then(() => {
          document.getElementById('prerequisiteData').value = '';
          resolve(null);
        });
    } else {
      prerequisiteStatus.innerText = 'No recognizable data found. Please ensure you have copied the full page.';
      prerequisiteStatus.classList.remove('status-good', 'status-default');
      prerequisiteStatus.classList.add('status-bad');
      showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).')
        .then(() => {
          document.getElementById('prerequisiteData').value = '';
          resolve(null);
        });
    }
  });
}

function parsePrerequisiteData(prerequisiteData) {
  try {
    const text = normalize(prerequisiteData);

    // Professor
    let professor = null;
    const profByLabel = text.match(/Professor:\s+(.+?)(?=\n|$)/i);
    if (profByLabel) professor = cleanString(profByLabel[1]);

    if (!professor) {
      // Some pages might only show "Instructor <name>"
      const alt = text.match(/^\s*Instructor\s+([^\n]+)$/im);
      if (alt) professor = cleanString(alt[1]);
    }
    if (!professor) throw new Error('Professor information not found.');

    // Course
    const courseMatch = text.match(/Course:\s+(.+?)(?=\n|$)/i);
    if (!courseMatch) throw new Error('Course information not found.');
    const course = cleanString(courseMatch[1]);

    // Meetings: try to find LEC/LAB numbers but don't hard-fail if missing
    let lecNum = null;
    let labNum = null;
    const meetingsChunkIdx = text.search(/(Meetings?|Schedule|Sections?):/i);
    const haystack = meetingsChunkIdx >= 0 ? text.slice(meetingsChunkIdx) : text;

    // Patterns "LEC - 12345", "LAB (12345)", "LEC: 12345", "12345 LEC"
    const forward = Array.from(haystack.matchAll(/(LEC|LECTURE|LAB|LABORATORY)\s*(?:-|:|\(|\s)*\s*(\d{5})/gi));
    const backward = Array.from(haystack.matchAll(/(\d{5})\s*(LEC|LECTURE|LAB|LABORATORY)/gi));
    const allMeet = [...forward, ...backward];

    for (const m of allMeet) {
      const a = (m[1] || '').toUpperCase();
      const b = (m[2] || '').toUpperCase();
      const role =
        /^(LEC|LECTURE)$/.test(a) ? 'LEC' :
        /^(LEC|LECTURE)$/.test(b) ? 'LEC' :
        /^(LAB|LABORATORY)$/.test(a) ? 'LAB' : 'LAB';
      const num = /\d{5}/.test(a) ? a : (/\d{5}/.test(b) ? b : null);
      if (!num) continue;
      if (role === 'LEC' && !lecNum) lecNum = num;
      if (role === 'LAB' && !labNum) labNum = num;
    }

    // Find the prerequisite section block
    const sectionHeader = text.search(PREREQ_SECTION_HEADER);
    if (sectionHeader < 0) {
      // Clear, friendly message for pages with no rendered prereq block
      showDialog(
        `No direct prerequisite section was found on this page for <strong>${cleanString(course)}</strong>.<br><br>` +
        `• This usually means the course has no direct prerequisites listed in LRCCD for this term.<br>` +
        `• If you expected prerequisites, try the <strong>Indirect Prerequisite Checker</strong> or verify in the catalog.`
      );
      // Return an empty structure to allow higher layer to show a non-error message
      return {
        professor, course, lecNum, labNum,
        prerequisiteCourses: {},
        meta: { hasSectionHeader: false, hasSections: false, totalRows: 0 }
      };
    }

    const prereqBlock = text.slice(sectionHeader);

    // Extract course sections: lines like "MET 256:" (admin/faculty)
    const indices = [];
    let m;
    while ((m = COURSE_HEADER_GLOBAL_RE.exec(prereqBlock)) !== null) {
      indices.push({ idx: m.index, courseCode: cleanString(m[1]) });
    }

    if (!indices.length) {
      // Header exists but there are no course subsections → treat as “no sections”
      return {
        professor, course, lecNum, labNum,
        prerequisiteCourses: {},
        meta: { hasSectionHeader: true, hasSections: false, totalRows: 0 }
      };
    }

    // For each section, slice to the next section and collect student IDs
    const prerequisiteCourses = {};
    let totalRows = 0;

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].idx;
      const end = i + 1 < indices.length ? indices[i + 1].idx : prereqBlock.length;
      const chunk = prereqBlock.slice(start, end);
      const headerLine = (chunk.trimStart().split('\n', 1)[0] || '').trim();
      const headerMatch = headerLine.match(/\b([A-Z]{2,5}\s*\d{3}[A-Z]?)\b/);
      const headerKey = headerMatch ? headerMatch[1] : `Section_${i + 1}`;

      // Initialize list
      prerequisiteCourses[headerKey] = [];

      // Prefer tab-delimited rows; fallback to multi-space tokenization
      const lines = chunk.split('\n').slice(1); // skip the "MET 256:" header line
      for (const lineRaw of lines) {
        const line = lineRaw.trim();
        if (!line) continue;
        if (/^Class rosters were last updated/i.test(line)) break;

        // Skip a known header row if present
        if (/^Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege$/i.test(line)) continue;

        // Case 1: tab-delimited columns
        if (line.includes('\t')) {
          const cols = line.split('\t').map((c) => c.trim()).filter(Boolean);
          const idCol = cols.find((c) => ID_RE.test(c));
          if (idCol) {
            const id = (idCol.match(ID_RE) || [])[1];
            if (id) {
              prerequisiteCourses[headerKey].push(id);
              totalRows += 1;
            }
          }
          continue;
        }

        // Case 2: multi-space separated (defensive)
        const cols2 = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
        const idCol2 = cols2.find((c) => ID_RE.test(c));
        if (idCol2) {
          const id = (idCol2.match(ID_RE) || [])[1];
          if (id) {
            prerequisiteCourses[headerKey].push(id);
            totalRows += 1;
          }
        }
      }
    }

    return {
      professor,
      course,
      lecNum,
      labNum,
      prerequisiteCourses,
      meta: { hasSectionHeader: true, hasSections: Object.keys(prerequisiteCourses).length > 0, totalRows }
    };

  } catch (error) {
    showDialog(`Error occurred while parsing prerequisite data: ${error.message}`);
    return null;
  }
}
