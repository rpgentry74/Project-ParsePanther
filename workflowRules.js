// workflowRules.js

export const SUBMISSION_ACTIONS = Object.freeze({
  READY: 'ready',
  NO_CHECKS_SELECTED: 'no-checks-selected',
  ROSTER_REQUIRED: 'roster-required',
  PREREQUISITE_REQUIRED: 'prerequisite-required',
  INDIRECT_EMPTY_CAN_CONTINUE: 'indirect-empty-can-continue',
  INDIRECT_EMPTY_ONLY: 'indirect-empty-only',
  INDIRECT_REQUIRES_REVIEW: 'indirect-requires-review',
});

export function evaluateSubmissionState({
  prerequisiteSelected,
  indirectSelected,
  rosterAccepted,
  prerequisiteAccepted,
  indirectAccepted,
  indirectTextPresent,
}) {
  if (!prerequisiteSelected && !indirectSelected) {
    return SUBMISSION_ACTIONS.NO_CHECKS_SELECTED;
  }

  if (!rosterAccepted) {
    return SUBMISSION_ACTIONS.ROSTER_REQUIRED;
  }

  if (prerequisiteSelected && !prerequisiteAccepted) {
    return SUBMISSION_ACTIONS.PREREQUISITE_REQUIRED;
  }

  if (indirectSelected && !indirectTextPresent) {
    if (prerequisiteSelected && prerequisiteAccepted) {
      return SUBMISSION_ACTIONS.INDIRECT_EMPTY_CAN_CONTINUE;
    }

    return SUBMISSION_ACTIONS.INDIRECT_EMPTY_ONLY;
  }

  if (indirectSelected && !indirectAccepted) {
    return SUBMISSION_ACTIONS.INDIRECT_REQUIRES_REVIEW;
  }

  return SUBMISSION_ACTIONS.READY;
}
