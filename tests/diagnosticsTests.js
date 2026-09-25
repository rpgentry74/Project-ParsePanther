// tests/diagnosticsTests.js
import {
  clearDiagnostics,
  getDiagnostics,
  recordDiagnostic,
  setDiagnosticState,
} from '../diagnostics.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runDiagnosticsPrivacyTest() {
  clearDiagnostics();

  recordDiagnostic('test-event', {
    code: 'SAFE_CODE',
    status: 'safe',
    source: 'diagnosticsTests.js',
    studentName: 'Alpha, Alex',
    studentID: '0123456',
    rawText: 'sensitive clipboard text',
  });

  setDiagnosticState({
    rosterAccepted: true,
    rosterVariant: 'faculty',
    directSelected: true,
    directAccepted: true,
    course: 'PSYC 335',
    professor: 'Doe, Jane',
  });

  const diagnostics = getDiagnostics();
  const event = diagnostics.events[0];

  assert(event, 'Diagnostic event was not stored');
  assert(event.details.code === 'SAFE_CODE', 'Safe diagnostic code was lost');
  assert(event.details.status === 'safe', 'Safe status was lost');
  assert(
    event.details.source === 'diagnosticsTests.js',
    'Safe source was lost'
  );

  assert(
    !Object.prototype.hasOwnProperty.call(event.details, 'studentName'),
    'Student name must not be stored in diagnostics'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(event.details, 'studentID'),
    'Student ID must not be stored in diagnostics'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(event.details, 'rawText'),
    'Raw pasted data must not be stored in diagnostics'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(diagnostics.state, 'course'),
    'Course information must not be stored in diagnostic state'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(diagnostics.state, 'professor'),
    'Professor information must not be stored in diagnostic state'
  );

  clearDiagnostics();
}

const output = document.getElementById('testResults');

try {
  runDiagnosticsPrivacyTest();
  output.textContent = 'All diagnostics privacy tests passed.';
  output.dataset.status = 'passed';
  console.log('All diagnostics privacy tests passed.');
} catch (error) {
  clearDiagnostics();
  output.textContent = `Diagnostics privacy test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
