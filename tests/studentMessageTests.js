// tests/studentMessageTests.js
import { buildStudentMessage } from '../studentMessage.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runStudentMessageTest() {
  const message = buildStudentMessage(
    {
      studentName: 'Alpha, Alex',
      studentID: '0123456',
    },
    {
      professor: 'Doe, Jane',
      course: 'PSYC 335: Research Methods in Psychology',
    },
    ['PSYC C1000', 'STAT C1000'],
    {
      'PSYC C1000': ['PSYC 300'],
      'STAT C1000': ['STAT 300'],
    }
  );

  assert(
    message.startsWith('Hello Alex,'),
    'Student first name was not formatted correctly'
  );
  assert(
    message.includes('- PSYC C1000 (PSYC 300)'),
    'First missing prerequisite was not listed with its former number'
  );
  assert(
    message.includes('- STAT C1000 (STAT 300)'),
    'Second missing prerequisite was not listed with its former number'
  );
  assert(
    message.endsWith('Professor Doe'),
    'Professor signature was not formatted correctly'
  );
  assert(
    !message.includes('0123456'),
    'Student ID must not be included in the Copy Message'
  );
  assert(
    !message.includes('Indirect Evidence'),
    'Copy Message must not present Indirect-only evidence as a missing prerequisite'
  );
}

const output = document.getElementById('testResults');

try {
  runStudentMessageTest();
  output.textContent = 'All student message tests passed.';
  output.dataset.status = 'passed';
  console.log('All student message tests passed.');
} catch (error) {
  output.textContent = `Student message test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
