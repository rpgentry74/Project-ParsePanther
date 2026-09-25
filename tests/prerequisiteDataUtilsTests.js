// tests/prerequisiteDataUtilsTests.js
import {
  mergePrerequisiteData,
  formatPrerequisiteDisplayName,
} from '../prerequisiteDataUtils.js';

const directData = {
  prerequisiteCourses: {
    'PSYC C1000': ['0123456'],
    'PSYC 330': ['2234567'],
    'STAT C1000': ['3234567'],
  },
  courseAliases: {
    'PSYC C1000': ['PSYC 300'],
    'STAT C1000': ['STAT 300'],
  },
};

const indirectData = {
  prerequisiteCourses: {
    'PSYC 300': ['4234567'],
    'PSYC 310': ['5234567'],
    'PSYC 330': ['6234567'],
    'STAT 300': ['7234567'],
  },
  courseAliases: {},
};

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

function runCcnAliasMergeTest() {
  const merged = mergePrerequisiteData(directData, indirectData);

  assert(
    Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'PSYC C1000'
    ),
    'Current PSYC CCN course should remain the canonical key'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'PSYC 300'
    ),
    'Former PSYC number should not create a duplicate prerequisite column'
  );
  assert(
    merged.prerequisiteCourses['PSYC C1000'].includes('0123456'),
    'Direct PSYC CCN completion was lost during merge'
  );
  assert(
    merged.prerequisiteCourses['PSYC C1000'].includes('4234567'),
    'Indirect PSYC former-number completion was not merged into the CCN course'
  );
  assert(
    merged.prerequisiteCourses['PSYC 330'].includes('2234567') &&
      merged.prerequisiteCourses['PSYC 330'].includes('6234567'),
    'Direct and Indirect PSYC 330 completions were not unioned'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'STAT 300'
    ),
    'Former STAT number should not create a duplicate prerequisite column'
  );
  assert(
    merged.prerequisiteCourses['STAT C1000'].includes('7234567'),
    'Indirect STAT former-number completion was not merged into the CCN course'
  );
  assertEqual(
    merged.courseAliases['PSYC C1000'][0],
    'PSYC 300',
    'PSYC former-course label was not preserved'
  );
  assertEqual(
    merged.courseAliases['STAT C1000'][0],
    'STAT 300',
    'STAT former-course label was not preserved'
  );
}

function runDisplayLabelTest() {
  assertEqual(
    formatPrerequisiteDisplayName('STAT C1000', ['STAT 300']),
    'STAT C1000\n(STAT 300)',
    'CCN display label formatting failed'
  );

  assertEqual(
    formatPrerequisiteDisplayName('HVAC 360', ['MET 255', 'MET 360']),
    'HVAC 360\n(MET 255, MET 360)',
    'Multiple former-course display labels failed'
  );
}

const output = document.getElementById('testResults');

try {
  runCcnAliasMergeTest();
  runDisplayLabelTest();

  output.textContent = 'All prerequisite merge/display tests passed.';
  output.dataset.status = 'passed';
  console.log('All prerequisite merge/display tests passed.');
} catch (error) {
  output.textContent = `Prerequisite merge/display test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
