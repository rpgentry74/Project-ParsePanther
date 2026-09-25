// tests/resultsModelTests.js
import { buildResultsModel } from '../resultsModel.js';

const rosterData = {
  professor: 'Doe, Jane',
  course: 'PSYC 335: Research Methods in Psychology',
  lecNum: '11679',
  labNum: null,
  studentRoster: [
    { studentName: 'Alpha, Alex', studentID: '0123456' },
    { studentName: 'Beta, Bailey', studentID: '2234567' },
    { studentName: 'Gamma, Casey', studentID: '3234567' },
  ],
};

const directData = {
  prerequisiteCourses: {
    'PSYC C1000': ['0123456'],
    'STAT C1000': ['0123456'],
  },
  courseAliases: {
    'PSYC C1000': ['PSYC 300'],
    'STAT C1000': ['STAT 300'],
  },
};

const indirectData = {
  prerequisiteCourses: {
    'PSYC 300': ['2234567'],
    'STAT 300': ['2234567'],
    'PSYC 310': ['3234567'],
  },
  courseAliases: {},
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected "${expected}", received "${actual}"`
    );
  }
}

function runResultsModelTest() {
  const model = buildResultsModel(
    rosterData,
    directData,
    indirectData
  );

  assert(model, 'Results model was not created');
  assertEqual(model.summary.studentCount, 3, 'Student count failed');
  assertEqual(model.summary.completeCount, 2, 'Complete count failed');
  assertEqual(model.summary.missingCount, 1, 'Missing count failed');
  assertEqual(
    model.summary.indirectCount,
    2,
    'Indirect Evidence count failed'
  );

  const alpha = model.students.find(
    ({ studentId }) => studentId === '0123456'
  );
  const beta = model.students.find(
    ({ studentId }) => studentId === '2234567'
  );
  const gamma = model.students.find(
    ({ studentId }) => studentId === '3234567'
  );

  assertEqual(alpha.status.key, 'complete', 'Direct completion status failed');
  assert(
    !alpha.hasIndirectEvidence,
    'Direct-only student should not be marked as having Indirect Evidence'
  );

  assertEqual(
    beta.status.key,
    'complete',
    'Indirect former-number completion should satisfy prerequisites'
  );
  assert(
    beta.hasIndirectEvidence,
    'Student completed through Indirect Evidence was not identified'
  );
  assert(
    beta.prerequisites.every((prerequisite) =>
      prerequisite.evidence.some(
        (entry) => entry.source === 'indirect'
      )
    ),
    'Indirect prerequisite provenance was not retained'
  );

  assertEqual(
    gamma.status.key,
    'missing',
    'Indirect-only evidence must not satisfy unrelated prerequisites'
  );
  assertEqual(
    gamma.missingPrerequisites.length,
    2,
    'Missing prerequisite count failed'
  );
  assert(
    gamma.hasIndirectEvidence,
    'Indirect-only evidence should still be visible for filtering'
  );
  assertEqual(
    gamma.indirectEvidence[0].courseName,
    'PSYC 310',
    'Indirect-only course was not retained'
  );
}

const output = document.getElementById('testResults');

try {
  runResultsModelTest();
  output.textContent = 'All results model tests passed.';
  output.dataset.status = 'passed';
  console.log('All results model tests passed.');
} catch (error) {
  output.textContent = `Results model test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
