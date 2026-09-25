// tests/rosterParserTests.js
import { detectRosterVariant, parseRosterText } from '../rosterParser.js';

const facultyRosterSample = `Sacramento City College Logo

Return to Services
Class Roster
Professor:\t \tDoe, Jane
Course:\t \tHVAC 364: Electrical Controls
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 18489)
Th\t \t6:00 pm-\t9:05 pm\t \tRoom Lusk Center 116 (LAB - 18490)
Term:\t \tFall 2026 | Full Semester
Printable Class Roster | Prereq Checker
#\tStudent Name\tID Num\tAdd Date\tAttendance / Notes
1.\tAlpha, Alex\t
0123456\tMay 05, 2026\t________________________________
2.\tBeta, Bailey *\t
2234567\tMay 04, 2026\t________________________________
Dropped Students\tDrop Date (reason)
1.\tDropped, Dana\t
3234567\tApr 29, 2026\tSep 06, 2026 (Student Drop)
Permission Numbers
`;

const adminRosterSample = `Skip to main content
Sacramento City College Logo
Admin Rosters
Class Rosters
Instructor Jane Doe
Course:
HVAC 364:  Electrical Controls
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t  LEC (18489) \t
 Th \t 6:00 pm - 9:05 pm \t Lusk Center 116 \t  LAB (18490) \t
Term:
Fall 2026 | Full Semester
Printable Class Roster | Prereq Checker
Current Students
    Student Name
Student ID

1. Alpha, Alex
0123456

2. Beta, Bailey*
2234567

Wait List
3. Wait, Wendy
3234567
Drops
    Student Name
Student ID
1. Dropped, Dana
4234567
Permission Numbers
`;

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", received "${actual}"`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runFacultyTest() {
  assertEqual(
    detectRosterVariant(facultyRosterSample),
    'faculty',
    'Faculty roster detection failed'
  );

  const result = parseRosterText(facultyRosterSample);

  assert(result.ok, result.message || 'Faculty roster parsing failed');
  assertEqual(result.data.variant, 'faculty', 'Faculty variant missing from output');
  assertEqual(result.data.professor, 'Doe, Jane', 'Faculty professor parsing failed');
  assertEqual(
    result.data.course,
    'HVAC 364: Electrical Controls',
    'Faculty course parsing failed'
  );
  assertEqual(result.data.lecNum, '18489', 'Faculty LEC parsing failed');
  assertEqual(result.data.labNum, '18490', 'Faculty LAB parsing failed');
  assertEqual(result.data.studentRoster.length, 2, 'Faculty active student count failed');
  assertEqual(
    result.data.studentRoster[0].studentID,
    '0123456',
    'Faculty leading-zero student ID was not preserved'
  );
  assert(
    !result.data.studentRoster.some((student) => student.studentName === 'Dropped, Dana'),
    'Faculty dropped student was incorrectly included'
  );
}

function runAdminTest() {
  assertEqual(
    detectRosterVariant(adminRosterSample),
    'admin',
    'Admin roster detection failed'
  );

  const result = parseRosterText(adminRosterSample);

  assert(result.ok, result.message || 'Admin roster parsing failed');
  assertEqual(result.data.variant, 'admin', 'Admin variant missing from output');
  assertEqual(result.data.professor, 'Doe, Jane', 'Admin professor parsing failed');
  assertEqual(
    result.data.course,
    'HVAC 364: Electrical Controls',
    'Admin course parsing failed'
  );
  assertEqual(result.data.lecNum, '18489', 'Admin LEC parsing failed');
  assertEqual(result.data.labNum, '18490', 'Admin LAB parsing failed');
  assertEqual(
    result.data.studentRoster.length,
    3,
    'Admin active + waitlist student count failed'
  );
  assertEqual(
    result.data.studentRoster[0].studentID,
    '0123456',
    'Admin leading-zero student ID was not preserved'
  );
  assert(
    result.data.studentRoster.some((student) => student.studentName === 'Wait, Wendy'),
    'Admin waitlist student was not included'
  );
  assert(
    !result.data.studentRoster.some((student) => student.studentName === 'Dropped, Dana'),
    'Admin dropped student was incorrectly included'
  );
}

const output = document.getElementById('testResults');

try {
  runFacultyTest();
  runAdminTest();
  output.textContent = 'All roster parser tests passed.';
  output.dataset.status = 'passed';
  console.log('All roster parser tests passed.');
} catch (error) {
  output.textContent = `Roster parser test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
