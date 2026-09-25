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
    'MATH C1000': ['4234567'],
  },
  courseAliases: {
    'PSYC C1000': ['PSYC 300'],
    'STAT C1000': ['STAT 300'],
  },
};

const indirectData = {
  prerequisiteCourses: {
    'PSYC 300': ['5234567'],
    'PSYC 310': ['6234567'],
    'PSYC 330': ['7234567'],
    'STAT 300': ['8234567'],
    'MATH 300': ['9234567'],
  },
  courseAliases: {
    'MATH C1000': ['MATH 300'],
    'PSYC 310': ['PSYC 305'],
  },
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

function runOfficialPrerequisiteMergeTest() {
  const merged = mergePrerequisiteData(directData, indirectData);

  assert(
    Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'PSYC C1000'
    ),
    'Current PSYC CCN course should remain the official prerequisite key'
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
    merged.prerequisiteCourses['PSYC C1000'].includes('5234567'),
    'Indirect completion under an official former PSYC number should satisfy the official prerequisite'
  );
  assert(
    merged.prerequisiteCourses['PSYC 330'].includes('2234567') &&
      merged.prerequisiteCourses['PSYC 330'].includes('7234567'),
    'Indirect completion under the exact official course should satisfy the official prerequisite'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'STAT 300'
    ),
    'Former STAT number should not create a duplicate prerequisite column'
  );
  assert(
    merged.prerequisiteCourses['STAT C1000'].includes('8234567'),
    'Indirect STAT former-number completion was not merged into the official CCN course'
  );
}

function runFormerAliasFromIndirectTest() {
  const merged = mergePrerequisiteData(directData, indirectData);

  assertEqual(
    merged.courseAliases['MATH C1000'][0],
    'MATH 300',
    'A former-course relationship documented on the Indirect page should be preserved'
  );
  assert(
    merged.prerequisiteCourses['MATH C1000'].includes('9234567'),
    'A former number documented on the Indirect page should be able to satisfy the official prerequisite'
  );
}

function runIndirectOnlyEvidenceTest() {
  const merged = mergePrerequisiteData(directData, indirectData);

  assert(
    !Object.prototype.hasOwnProperty.call(
      merged.prerequisiteCourses,
      'PSYC 310'
    ),
    'An Indirect-only course must not become an evaluated prerequisite'
  );
  assert(
    Object.prototype.hasOwnProperty.call(
      merged.indirectEvidenceCourses,
      'PSYC 310'
    ),
    'An Indirect-only course should remain visible as informational evidence'
  );
  assert(
    merged.indirectEvidenceCourses['PSYC 310'].includes('6234567'),
    'Indirect-only student evidence was lost'
  );
  assertEqual(
    merged.indirectEvidenceAliases['PSYC 310'][0],
    'PSYC 305',
    'Former-course identity for an Indirect-only course should remain visible'
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
  runOfficialPrerequisiteMergeTest();
  runFormerAliasFromIndirectTest();
  runIndirectOnlyEvidenceTest();
  runDisplayLabelTest();

  output.textContent = 'All prerequisite merge/display tests passed.';
  output.dataset.status = 'passed';
  console.log('All prerequisite merge/display tests passed.');
} catch (error) {
  output.textContent = `Prerequisite merge/display test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
