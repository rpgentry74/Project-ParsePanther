// tests/indirectPrerequisiteParserTests.js
import {
  detectIndirectPrerequisiteVariant,
  parseIndirectPrerequisiteText,
} from '../indirectPrerequisiteParser.js';

const facultySample = `Sacramento City College Logo

Return to Services
Indirect Prerequisite Checker [Experimental Service]
Sacramento City College
Professor:\t \tDoe, Jane
Course:\t \tHVAC 364: Electrical Controls
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 18489)
Th\t \t6:00 pm-\t9:05 pm\t \tRoom Lab 116 (LAB - 18490)
Term:\t \tFall 2026
INDIRECT PREQUISITES
Different courses may share the same prerequisite.
LIST OF STUDENTS WHO HAVE COMPLETED THE PREREQUISITE COURSES INDIRECTLY
HVAC 256 (formerly MET 256):
Alpha\tAlex\t0123456\tFall 2025\t@ SCC
Beta\tBailey\t2234567\tSpring 2026\t@ SCC
HVAC 360 (formerly MET 255, MET 360):
Alpha\tAlex\t0123456\tSpring 2026\t@ SCC
HVAC 364 (formerly MET 364):
HVAC 372 (formerly MET 372):
Beta\tBailey\t2234567\tSpring 2026\t@ SCC
`;

const brokenFacultyStructure = `Indirect Prerequisite Checker [Experimental Service]
Professor:\t \tDoe, Jane
Course:\t \tHVAC 364: Electrical Controls
Meetings:\t \t
 \t1:00 am-\t1:00 am\t \tRoom Online 000 (LEC - 18489)
Th\t \t6:00 pm-\t9:05 pm\t \tRoom Lab 116 (LAB - 18490)
INDIRECT PREQUISITES
LIST OF STUDENTS WHO HAVE COMPLETED THE PREREQUISITE COURSES INDIRECTLY
A heading ParsePanther does not recognize
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
    detectIndirectPrerequisiteVariant(facultySample),
    'faculty',
    'Faculty indirect prerequisite detection failed'
  );

  const result = parseIndirectPrerequisiteText(facultySample);

  assert(result.ok, result.message || 'Faculty indirect prerequisite parsing failed');
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
    result.data.prerequisiteCourses['HVAC 364'].length,
    0,
    'Empty indirect prerequisite section should be preserved'
  );
  assertEqual(
    result.data.courseAliases['HVAC 360'][0],
    'MET 255',
    'First former-course alias was not captured'
  );
  assertEqual(
    result.data.courseAliases['HVAC 360'][1],
    'MET 360',
    'Second former-course alias was not captured'
  );
}

function runFailClosedTest() {
  const result = parseIndirectPrerequisiteText(brokenFacultyStructure);

  assert(!result.ok, 'Unrecognized indirect course headings must fail closed');
  assertEqual(
    result.code,
    'INDIRECT_PREREQUISITE_PARSE_FAILED',
    'Unexpected failure code for unrecognized indirect headings'
  );
}

const output = document.getElementById('testResults');

try {
  runFacultyTest();
  runFailClosedTest();

  output.textContent = 'All indirect prerequisite parser tests passed.';
  output.dataset.status = 'passed';
  console.log('All indirect prerequisite parser tests passed.');
} catch (error) {
  output.textContent = `Indirect prerequisite parser test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
