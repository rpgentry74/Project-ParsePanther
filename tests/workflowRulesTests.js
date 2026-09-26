// tests/workflowRulesTests.js
import {
  evaluateSubmissionState,
  SUBMISSION_ACTIONS,
} from '../workflowRules.js';

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected "${expected}", received "${actual}"`
    );
  }
}

const baseState = {
  prerequisiteSelected: true,
  indirectSelected: false,
  rosterAccepted: true,
  prerequisiteAccepted: true,
  indirectAccepted: false,
  indirectTextPresent: false,
};

function runWorkflowRulesTest() {
  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      prerequisiteSelected: false,
    }),
    SUBMISSION_ACTIONS.NO_CHECKS_SELECTED,
    'No-selection rule failed'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      rosterAccepted: false,
    }),
    SUBMISSION_ACTIONS.ROSTER_REQUIRED,
    'Roster-required rule failed'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      prerequisiteAccepted: false,
    }),
    SUBMISSION_ACTIONS.PREREQUISITE_REQUIRED,
    'Prerequisite-required rule failed'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      indirectSelected: true,
    }),
    SUBMISSION_ACTIONS.INDIRECT_EMPTY_CAN_CONTINUE,
    'Empty Indirect continuation rule failed'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      prerequisiteSelected: false,
      prerequisiteAccepted: false,
      indirectSelected: true,
    }),
    SUBMISSION_ACTIONS.INDIRECT_EMPTY_ONLY,
    'Indirect-only empty rule failed'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      indirectSelected: true,
      indirectTextPresent: true,
      indirectAccepted: false,
    }),
    SUBMISSION_ACTIONS.INDIRECT_REQUIRES_REVIEW,
    'Failed Indirect parse must require review'
  );

  assertEqual(
    evaluateSubmissionState({
      ...baseState,
      indirectSelected: true,
      indirectTextPresent: true,
      indirectAccepted: true,
    }),
    SUBMISSION_ACTIONS.READY,
    'Valid Direct and Indirect workflow should be ready'
  );

  assertEqual(
    evaluateSubmissionState(baseState),
    SUBMISSION_ACTIONS.READY,
    'Valid prerequisite-only workflow should be ready'
  );
}

const output = document.getElementById('testResults');

try {
  runWorkflowRulesTest();
  output.textContent = 'All workflow rule tests passed.';
  output.dataset.status = 'passed';
  console.log('All workflow rule tests passed.');
} catch (error) {
  output.textContent = `Workflow rule test failed: ${error.message}`;
  output.dataset.status = 'failed';
  console.error(error);
}
