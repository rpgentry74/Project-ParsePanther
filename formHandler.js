// formHandler.js
import { generateHTMLTable } from './generateHTMLTable.js';
import { showDialog } from './dialogHandler.js';
import { getState } from './state.js';
import { recordDiagnostic, setDiagnosticState } from './diagnostics.js';
import {
  evaluateSubmissionState,
  SUBMISSION_ACTIONS,
} from './workflowRules.js';

function disableIndirectEvidence(includeIndirectPrerequisites) {
  includeIndirectPrerequisites.checked = false;
  includeIndirectPrerequisites.dispatchEvent(new Event('change'));
}

export async function handleFormSubmission() {
  recordDiagnostic('process-data-selected');

  const includeDirectPrerequisites =
    document.getElementById('includeDirectPrerequisites');
  const includeIndirectPrerequisites =
    document.getElementById('includeIndirectPrerequisites');
  const indirectPrerequisiteTextbox =
    document.getElementById('indirectPrerequisiteData');

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  const submissionAction = evaluateSubmissionState({
    prerequisiteSelected: includeDirectPrerequisites.checked,
    indirectSelected: includeIndirectPrerequisites.checked,
    rosterAccepted: Boolean(rosterData),
    prerequisiteAccepted: Boolean(directPrerequisiteData),
    indirectAccepted: Boolean(indirectPrerequisiteData),
    indirectTextPresent:
      indirectPrerequisiteTextbox.value.trim().length > 0,
  });

  switch (submissionAction) {
    case SUBMISSION_ACTIONS.NO_CHECKS_SELECTED:
      recordDiagnostic('process-blocked', {
        code: 'NO_CHECK_TYPE_SELECTED',
      });
      await showDialog(
        'Please select Prerequisites, Indirect Evidence, or both before processing.'
      );
      return;

    case SUBMISSION_ACTIONS.ROSTER_REQUIRED:
      recordDiagnostic('process-blocked', {
        code: 'ROSTER_REQUIRED',
      });
      await showDialog(
        'Please paste and confirm the Class Roster data before processing prerequisites.'
      );
      return;

    case SUBMISSION_ACTIONS.PREREQUISITE_REQUIRED:
      recordDiagnostic('process-blocked', {
        code: 'DIRECT_REQUIRED',
      });
      await showDialog(
        'Please paste and successfully process the Prerequisite Checker data before continuing.'
      );
      return;

    case SUBMISSION_ACTIONS.INDIRECT_EMPTY_CAN_CONTINUE: {
      const continueWithoutIndirect = await showDialog(
        'No Indirect Prerequisite Checker data has been provided.<br><br>You can continue using the prerequisite data already processed, or go back and paste the Indirect Prerequisite Checker page.',
        true,
        {
          closeLabel: 'Go Back',
          confirmLabel: 'Continue Without Indirect Evidence',
        }
      );

      if (!continueWithoutIndirect) {
        recordDiagnostic('indirect-empty-continue-declined');
        return;
      }

      recordDiagnostic('indirect-empty-continued-without');
      disableIndirectEvidence(includeIndirectPrerequisites);
      break;
    }

    case SUBMISSION_ACTIONS.INDIRECT_EMPTY_ONLY:
      recordDiagnostic('process-blocked', {
        code: 'INDIRECT_ONLY_EMPTY',
      });
      await showDialog(
        'Indirect Evidence is selected, but no Indirect Prerequisite Checker data has been provided.<br><br>Paste the Indirect Prerequisite Checker page, or select Prerequisites instead.'
      );
      return;

    case SUBMISSION_ACTIONS.INDIRECT_REQUIRES_REVIEW:
      recordDiagnostic('process-blocked', {
        code: 'INDIRECT_PARSE_REQUIRED',
      });
      await showDialog(
        'Indirect Prerequisite Checker data was pasted but did not process successfully.<br><br>Please review the pasted data before continuing.'
      );
      return;

    case SUBMISSION_ACTIONS.READY:
    default:
      break;
  }

  generateHTMLTable();
  setDiagnosticState({ outputGenerated: true });
  recordDiagnostic('results-generated');

  document.getElementById('tableContainer').style.display = 'block';
  document
    .getElementById('tableContainer')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}
