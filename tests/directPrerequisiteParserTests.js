// tests/directPrerequisiteParserTests.js
import {
  detectDirectPrerequisiteVariant,
  parseDirectPrerequisiteText,
} from '../directPrerequisiteParser.js';

const facultySample = `Sacramento City College Logo

Return to Services
Prerequisite Checker
Sacramento City College
Professor:\t \tDoe, Jane
Course:\t \tHVAC 364: Electrical Controls
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 18489)
Th\t \t6:00 pm-\t9:05 pm\t \tRoom Lab 116 (LAB - 18490)
Term:\t \tFall 2026
Prerequisite Checking Overview
Known Limitations
PREREQUISITE COURSES COMPLETED WITHIN LOS RIOS
HVAC 256 (formerly MET 256)
Alpha\tAlex\t0123456\tFall 2025\t@ SCC
Beta\tBailey\t2234567\tSpring 2026\t@ SCC
HVAC 351 (formerly MET 351)
Alpha\tAlex\t0123456\tFall 2025\t@ SCC
`;

const adminSample = `Skip to main content
Sacramento City College Logo
Admin Class List
Services
Prerequisite Checker
Instructor Jane Doe
Course:
HVAC 364:  Electrical Controls
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t  LEC (18489) \t
 Th \t 6:00 pm - 9:05 pm \t Lab 116 \t  LAB (18490) \t
Term:
Fall 2026
Known Limitations
HVAC 364 Prerequisite Courses Completed Within Los Rios
HVAC 256 (formerly MET 256):
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Alpha\tAlex\t0123456\tFall 2025\t@ SCC
Beta\tBailey\t2234567\tSpring 2026\t@ SCC

HVAC 351 (formerly MET 351):
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Alpha\tAlex\t0123456\tFall 2025\t@ SCC

Class rosters were last updated on Sep 25, 2026.
`;


const adminNoStudentRowsSample = `Admin Class List
Prerequisite Checker
Course:
HVAC 364: Electrical Controls
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t LEC (18489)
 Th \t 6:00 pm - 9:05 pm \t Lab 116 \t LAB (18490)
HVAC 364 Prerequisite Courses Completed Within Los Rios
HVAC 256 (formerly MET 256):
HVAC 351 (formerly MET 351):
`;


const facultyNoPrerequisitesSample = `Prerequisite Checker
Professor:\t \tDoe, Jane
Course:\t \tHVAC 100: Introduction to HVAC
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 12345)
Term:\t \tFall 2026
Prerequisite Checking Overview
PREREQUISITE COURSES COMPLETED WITHIN LOS RIOS
`;

const adminNoPrerequisitesSample = `Admin Class List
Prerequisite Checker
Course:
HVAC 100: Introduction to HVAC
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t LEC (12345)
Term:
Fall 2026
HVAC 100 Prerequisite Courses Completed Within Los Rios
Class rosters were last updated on Sep 25, 2026.
`;


const adminCcnSample = `Admin Class List
Prerequisite Checker
Course:
PSYC 335: Research Methods in Psychology
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t LEC (11679)
Term:
Fall 2026
PSYC 335 Prerequisite Courses Completed Within Los Rios
PSYC C1000 (formerly PSYC 300):
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Alpha\tAlex\t0123456\tFall 2025\t@ ARC
PSYC 330:
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Beta\tBailey\t2234567\tSpring 2026\t@ ARC
STAT C1000 (formerly STAT 300):
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Gamma\tCasey\t3234567\tSpring 2026\t@ FLC
Class rosters were last updated on Sep 25, 2026.
`;

const adminUnsupportedCourseBlockSample = `Admin Class List
Prerequisite Checker
Course:
PSYC 335: Research Methods in Psychology
Professor:
Doe, Jane
Meetings:
  \t 1:00 am - 1:00 am \t Online 000 \t LEC (11679)
PSYC 335 Prerequisite Courses Completed Within Los Rios
PSYC 330:
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Alpha\tAlex\t0123456\tFall 2025\t@ ARC
STAT X-1000:
Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege
Beta\tBailey\t2234567\tSpring 2026\t@ FLC
`;

const unknownDirectPageSample = `Prerequisite Checker
Professor:\t \tDoe, Jane
Course:\t \tHVAC 100: Introduction to HVAC
This page does not contain the recognized prerequisite section.
`;

const brokenFacultyStructure = `Prerequisite Checker
Professor:\t \tDoe, Jane
Course:\t \tHVAC 364: Electrical Controls
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 18489)
Th\t \t6:00 pm-\t9:05 pm\t \tRoom Lab 116 (LAB - 18490)
Prerequisite Checking Overview
PREREQUISITE COURSES COMPLETED WITHIN LOS RIOS
A heading format ParsePanther does not recognize
Alpha\tAlex\t0123456\tFall 2025\t@ SCC
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
    detectDirectPrerequisiteVariant(facultySample),
    'faculty',
    'Faculty direct prerequisite detection failed'
  );

  const result = parseDirectPrerequisiteText(facultySample);

  assert(result.ok, result.message || 'Faculty direct prerequisite parsing failed');
  assertEqual(result.data.variant, 'faculty', 'Faculty variant missing from output');
  assertEqual(result.data.professor, 'Doe, Jane', 'Faculty professor parsing failed');
  assertEqual(
    result.data.course,
    'HVAC 364: Electrical Controls',
    'Faculty course parsing failed'
  );
  assertEqual(result.data.lecNum, '18489', 'Faculty LEC parsing failed');
  assertEqual(result.data.labNum, '18490', 'Faculty LAB parsing failed');
  assertEqual(
    result.data.prerequisiteCourses['HVAC 256'][0],
    '0123456',
    'Faculty leading-zero student ID was not preserved'
  );
  assertEqual(
    result.data.courseAliases['HVAC 256'][0],
    'MET 256',
    'Faculty former-course alias was not captured'
  );
}

function runAdminTest() {
  assertEqual(
    detectDirectPrerequisiteVariant(adminSample),
    'admin',
    'Admin direct prerequisite detection failed'
  );

  const result = parseDirectPrerequisiteText(adminSample);

  assert(result.ok, result.message || 'Admin direct prerequisite parsing failed');
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
    result.data.prerequisiteCourses['HVAC 256'][0],
    '0123456',
    'Admin leading-zero student ID was not preserved'
  );
  assertEqual(
    result.data.courseAliases['HVAC 256'][0],
    'MET 256',
    'Admin former-course alias was not captured'
  );
}


function runAdminNoStudentRowsTest() {
  assertEqual(
    detectDirectPrerequisiteVariant(adminNoStudentRowsSample),
    'admin',
    'Admin zero-row prerequisite detection failed'
  );

  const result = parseDirectPrerequisiteText(adminNoStudentRowsSample);

  assert(result.ok, result.message || 'Admin zero-row prerequisite parsing failed');
  assertEqual(
    result.data.prerequisiteCourses['HVAC 256'].length,
    0,
    'Admin zero-row prerequisite should preserve an empty course list'
  );
  assertEqual(
    result.data.prerequisiteCourses['HVAC 351'].length,
    0,
    'Admin zero-row second prerequisite should preserve an empty course list'
  );
}



function runAdminCcnTest() {
  assertEqual(
    detectDirectPrerequisiteVariant(adminCcnSample),
    'admin',
    'Admin CCN direct prerequisite detection failed'
  );

  const result = parseDirectPrerequisiteText(adminCcnSample);

  assert(result.ok, result.message || 'Admin CCN direct prerequisite parsing failed');
  assertEqual(
    result.data.prerequisiteCourses['PSYC C1000'][0],
    '0123456',
    'CCN PSYC course was not parsed'
  );
  assertEqual(
    result.data.courseAliases['PSYC C1000'][0],
    'PSYC 300',
    'CCN PSYC former-course alias was not captured'
  );
  assertEqual(
    result.data.prerequisiteCourses['PSYC 330'][0],
    '2234567',
    'Legacy PSYC prerequisite was not preserved'
  );
  assertEqual(
    result.data.prerequisiteCourses['STAT C1000'][0],
    '3234567',
    'CCN STAT course was not parsed'
  );
  assertEqual(
    result.data.courseAliases['STAT C1000'][0],
    'STAT 300',
    'CCN STAT former-course alias was not captured'
  );
}

function runUnsupportedCourseBlockFailClosedTest() {
  const result = parseDirectPrerequisiteText(adminUnsupportedCourseBlockSample);

  assert(!result.ok, 'Unsupported course blocks with student rows must fail closed');
  assertEqual(
    result.code,
    'DIRECT_PREREQUISITE_PARSE_FAILED',
    'Unexpected failure code for an unsupported Direct course block'
  );
}

function runFacultyNoPrerequisitesTest() {
  const result = parseDirectPrerequisiteText(facultyNoPrerequisitesSample);

  assert(result.ok, result.message || 'Faculty no-prerequisite page should parse');
  assertEqual(
    result.data.requiresNoPrerequisiteConfirmation,
    true,
    'Faculty no-prerequisite page should require confirmation'
  );
  assertEqual(
    Object.keys(result.data.prerequisiteCourses).length,
    0,
    'Faculty no-prerequisite page should return an empty prerequisite set'
  );
}

function runAdminNoPrerequisitesTest() {
  const result = parseDirectPrerequisiteText(adminNoPrerequisitesSample);

  assert(result.ok, result.message || 'Admin no-prerequisite page should parse');
  assertEqual(
    result.data.requiresNoPrerequisiteConfirmation,
    true,
    'Admin no-prerequisite page should require confirmation'
  );
  assertEqual(
    Object.keys(result.data.prerequisiteCourses).length,
    0,
    'Admin no-prerequisite page should return an empty prerequisite set'
  );
}

function runUnrecognizedHeadingFailClosedTest() {
  const result = parseDirectPrerequisiteText(brokenFacultyStructure);

  assert(!result.ok, 'Unrecognized Direct headings with student rows must fail closed');
  assertEqual(
    result.code,
    'DIRECT_PREREQUISITE_PARSE_FAILED',
    'Unexpected failure code for an unrecognized Direct heading'
  );
}

function runUnknownFormatFailClosedTest() {
  const result = parseDirectPrerequisiteText(unknownDirectPageSample);

  assert(!result.ok, 'A page without a recognized Direct section must still fail closed');
  assertEqual(
    result.code,
    'UNKNOWN_DIRECT_PREREQUISITE_FORMAT',
    'Unexpected failure code for an unrecognized Direct page'
  );
}

const output = document.getElementById('testResults');

try {
  runFacultyTest();
  runAdminTest();
  runAdminNoStudentRowsTest();
  runAdminCcnTest();
  runUnsupportedCourseBlockFailClosedTest();
  runFacultyNoPrerequisitesTest();
  runAdminNoPrerequisitesTest();
  runUnrecognizedHeadingFailClosedTest();
  runUnknownFormatFailClosedTest();

  output.textContent = 'All direct prerequisite parser tests passed.';
  output.dataset.status = 'passed';
  console.log('All direct prerequisite parser tests passed.');
} catch (error) {
  output.textContent = `Direct prerequisite parser test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
