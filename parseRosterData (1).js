// Import the state functions
import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

// --- Helpers ---
function normalize(str) {
  return String(str || '')
    .replace(/\u00A0/g, ' ')           // NBSP → space
    .replace(/\r\n?/g, '\n')           // CRLF → LF
    .replace(/[ \t]+/g, ' ')           // collapse spaces/tabs
    .replace(/[ \t]*\n[ \t]*/g, '\n')  // trim line margins around newlines
    .trim();
}
function cleanString(str) {
  return String(str || '').replace(/\s+/g, ' ').trim();
}

// Labels / patterns resilient to LRCCD variants
const LABELS = {
  professor: /(Professor|Instructor|Faculty)\s*:/i,
  course: /(Course|Class)\s*:/i,
  meetings: /(Meetings?|Schedule|Sections?)\s*:/i,

  // student headers (faculty/admin) — intentionally avoid generic "Roster"
  studentHeader: /(Student Name.*(ID|ID\s*Num)|Student Name|Current Students|Enrolled Students|Active Students|Student Roster)/i,

  // waitlist header
  waitListHeader: /^\s*(Wait\s*List|Waitlist)\s*$/im,

  // blocks that should stop scans
  stopBlocks: /^(Dropped Students|Drops|Permission Numbers|Audits?|Inactive Students)/im,
};

export function parseRosterData() {
  return new Promise((resolve) => {
    const rosterDataRaw = document.getElementById('rosterData').value;
    const rosterData = normalize(rosterDataRaw);
    const rosterStatus = document.getElementById('rosterStatus');

    // Guard: user pasted a Prerequisite page into the roster field
    const prereqSignals = [
      /Prerequisite\s*Checker/i,
      /Indirect\s*Prerequisite\s*Checker/i,
      /Prerequisite\s*Checking\s*Overview/i,
      /Known\s*Limitations/i,
      /PREREQUISITE\s+COURSES\s+COMPLETED\s+WITHIN\s+LOS\s+RIOS/i,
    ];
    if (prereqSignals.some((re) => re.test(rosterData))) {
      rosterStatus.innerText = 'Invalid data provided. Please paste the Class Roster data.';
      rosterStatus.classList.remove('status-good', 'status-default');
      rosterStatus.classList.add('status-bad');
      showDialog(
        'It looks like you pasted Prerequisite/Indirect Prerequisite data into the Class Roster field. Please paste the Class Roster page first.'
      ).then(() => {
        document.getElementById('rosterData').value = '';
        resolve(null);
      });
      return;
    }

    // Accept as roster if strong signals + professor/instructor present
    const rosterSignals = [
      /Class\s*Rosters?/i,
      /Printable\s*Class\s*Roster/i,
      // OLD: /#\s*Student\s*Name[\s\S]{0,120}?(?:ID|ID\s*Num)/i, // faculty header
      /#\s*Student\s*Name\s*ID\s*Num/i,                            // NEW flexible faculty header
      /Current\s*Students/i,                                      // admin header
      /Student\s*Name[\s\S]{0,80}\b(Student ID|ID|ID\s*Num)\b/i,    // admin paired headers
    ];
    const isClassRoster =
      rosterSignals.some((re) => re.test(rosterData)) &&
      (LABELS.professor.test(rosterData) || /Instructor\b/i.test(rosterData));

    if (!isClassRoster) {
      rosterStatus.innerText = 'No recognizable roster headers found. Please ensure you copied the full page.';
      rosterStatus.classList.remove('status-good', 'status-default');
      rosterStatus.classList.add('status-bad');
      showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).').then(() => {
        document.getElementById('rosterData').value = '';
        resolve(null);
      });
      return;
    }

    const parsed = parseClassRosterData(rosterData);
    if (!parsed) {
      rosterStatus.innerText = 'Unable to parse roster. Please confirm you copied the full page.';
      rosterStatus.classList.remove('status-good', 'status-default');
      rosterStatus.classList.add('status-bad');
      return resolve(null);
    }

    const { professor, course, lecNum, labNum } = parsed;

    showDialog(
      `Is this information correct? <br>
      <strong>Professor:</strong> ${professor || 'N/A'} <br>
      <strong>Course:</strong> ${course || 'N/A'}<br>
      <strong>LEC Number:</strong> ${lecNum || 'N/A'}<br>
      <strong>LAB Number:</strong> ${labNum || 'N/A'}`,
      true
    ).then((confirmed) => {
      if (confirmed) {
        setState({ rosterData: parsed });
        const overlay = document.getElementById('disableUntilRosterAccepted');
        if (overlay) overlay.style.display = 'none';
        rosterStatus.innerText = 'Roster data processed successfully.';
        rosterStatus.classList.remove('status-bad', 'status-default');
        rosterStatus.classList.add('status-good');
        resolve(parsed);
      } else {
        document.getElementById('rosterData').value = '';
        setState({ rosterData: null });
        rosterStatus.innerText = 'Roster data processing cancelled by user.';
        rosterStatus.classList.remove('status-good', 'status-default');
        rosterStatus.classList.add('status-bad');
        resolve(null);
      }
    });
  });
}

// --- Field parsers ---
function parseBetween(text, leftRegex, rightRegex) {
  const left = text.search(leftRegex);
  if (left < 0) return null;
  const afterLeft = text.slice(left).replace(leftRegex, '').trim();
  if (!rightRegex) return cleanString(afterLeft);
  const right = afterLeft.search(rightRegex);
  const slice = right >= 0 ? afterLeft.slice(0, right) : afterLeft;
  return cleanString(slice);
}
function parseProfessor(text) {
  const stop = new RegExp(`\\s*(?:${LABELS.course.source}|${LABELS.meetings.source})`, 'i');
  const byLabel = parseBetween(text, LABELS.professor, stop);
  if (byLabel) return byLabel;
  const alt = text.match(/^\s*Instructor\s+([^\n]+)$/im);
  return alt ? cleanString(alt[1]) : null;
}
function parseCourse(text) {
  const stop = new RegExp(`\\s*(?:${LABELS.meetings.source}|${LABELS.professor.source})`, 'i');
  return parseBetween(text, LABELS.course, stop);
}
function parseMeetings(text) {
  let lecNum = null;
  let labNum = null;
  const idx = text.search(LABELS.meetings);
  const haystack = idx >= 0 ? text.slice(idx) : text;

  const forward = Array.from(
    haystack.matchAll(/(LEC|LECTURE|LAB|LABORATORY)\s*(?:-|:|\(|\s)*\s*(\d{5})/gi)
  );
  const backward = Array.from(
    haystack.matchAll(/(\d{5})\s*(LEC|LECTURE|LAB|LABORATORY)/gi)
  );
  const all = [...forward, ...backward];

  for (const m of all) {
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
  return { lecNum, labNum };
}

// --- Roster scanning helpers ---
function findRosterStart(text) {
  // Prefer the admin header “Current Students” if present.
  const currentRe = /^\s*Current Students\s*$/igm;
  const hashRe    = /#\s*Student\s*Name\s*ID\s*Num/i;                       // faculty header
  const pairRe    = /Student Name[\s\S]{0,80}\b(Student ID|ID|ID\s*Num)\b/ig; // admin paired headers

  const firstIndex = (re) => {
    const m = re.exec(text);
    // Reset lastIndex for safety in case the regex is reused
    re.lastIndex = 0;
    return m ? m.index : -1;
  };

  // 1) If "Current Students" exists, start there (admin format)
  const idxCurrent = firstIndex(currentRe);
  if (idxCurrent >= 0) return idxCurrent;

  // 2) Else take the earliest of the other recognizable headers
  const idxHash = firstIndex(hashRe);
  const idxPair = firstIndex(pairRe);

  const candidates = [idxHash, idxPair].filter((i) => i >= 0);
  if (candidates.length) return Math.min(...candidates);

  // 3) Fallback to the broader studentHeader pattern if nothing else matched
  const fallback = text.match(/(Student Name.*(ID|ID\s*Num)|Student Name|Current Students|Enrolled Students|Active Students|Student Roster)/i);
  return fallback ? fallback.index : -1;
}


function parseCombinedStudents(text) {
  // Build ONE combined list:
  // - Active roster (from header) … continues through Wait List
  // - Stops before Dropped/Permission Numbers blocks
  const students = [];

  const startIdx = findRosterStart(text);
  if (startIdx < 0) throw new Error('Student roster start line not found.');

  const afterHeader = text.slice(startIdx);

  // Hard stop before any excluded blocks
  const stopMatch = afterHeader.match(LABELS.stopBlocks);
  const scanBlock = stopMatch ? afterHeader.slice(0, stopMatch.index) : afterHeader;

  // We DO allow Wait List entries to be included; we just ignore its header line.
  const lines = scanBlock.split('\n').map((l) => l.trim()).filter(Boolean);

  const looksLikeName = (s) =>
    /^(\d{1,3}[\.\)]\s*)?([A-Za-z'.-]+,\s*[A-Za-z].+|[A-Za-z'.-]+\s+[A-Za-z].+)/.test(s) &&
    !/\b(ID|ID\s*Num)\b/i.test(s) &&
    !/^(Student Name|Student ID|Wait\s*List|Waitlist)$/i.test(s);

  const extractName = (s) => cleanString(
    s.replace(/^\d{1,3}[\.\)]\s*/, '')   // drop leading index "1.", "23)"
     .replace(/\s*\([^()]*\)\s*$/, '')   // drop trailing parens (pronouns)
     .replace(/\s*\*+$/, '')             // drop trailing asterisks
  );

  const findIDIn = (s) => {
    const m = s.match(/\b(\d{6,8})\b/);
    return m ? m[1] : null;
  };

  const isParenOrNote = (s) =>
    /^\([^()]{1,50}\)$/.test(s) || /^(Student ID|ID|ID\s*Num)$/i.test(s);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Single-line: name … ID on same line
    const singleID = findIDIn(line);
    if (singleID) {
      const namePart = line.split(/\b\d{6,8}\b/, 1)[0];
      if (looksLikeName(namePart)) {
        const name = extractName(namePart);
        if (name) {
          students.push({ studentID: singleID, studentName: name });
          continue;
        }
      }
    }

    // Multi-line: name line → (optional pronoun/header) → ID on a following line
    if (looksLikeName(line)) {
      const name = extractName(line);
      let id = null, consumed = 0;
      for (let k = 1; k <= 3 && i + k < lines.length; k++) {
        const nxt = lines[i + k];
        // if we hit a stop block, bail
        if (LABELS.stopBlocks.test(nxt)) break;
        // skip pronoun/header lines
        if (isParenOrNote(nxt)) { consumed = k; continue; }
        id = findIDIn(nxt);
        if (id) { consumed = k; break; }
      }
      if (id) {
        students.push({ studentID: id, studentName: name });
        i += consumed;
        continue;
      }
    }
  }

  if (!students.length) throw new Error('No student roster information found.');
  return students;
}

// --- Main roster parse ---
function parseClassRosterData(rosterData) {
  try {
    const professor = parseProfessor(rosterData);
    if (!professor) throw new Error('Professor/Instructor label not found.');

    const course = parseCourse(rosterData);
    if (!course) throw new Error('Course/Class label not found.');

    const { lecNum, labNum } = parseMeetings(rosterData);

    // ONE combined list: Active + Wait List; excludes Dropped/Permission Numbers
    const studentRoster = parseCombinedStudents(rosterData);

    // Debug
    console.log('Parsed data:', { professor, course, lecNum, labNum, studentRoster });

    // Keep the original output shape exactly:
    return { professor, course, lecNum, labNum, studentRoster };
  } catch (error) {
    console.error('Error occurred while parsing roster data:', error.message);
    return null;
  }
}
