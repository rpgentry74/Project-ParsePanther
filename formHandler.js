// formHandler.js
import { generateHTMLTable } from './generateHTMLTable.js';
import { showDialog } from './dialogHandler.js';
import { getState } from './state.js';

function disableIndirectEvidence(includeIndirectPrerequisites) {
  includeIndirectPrerequisites.checked = false;
  includeIndirectPrerequisites.dispatchEvent(new Event('change'));
}

export async function handleFormSubmission() {
  const includeDirectPrerequisites =
    document.getElementById('includeDirectPrerequisites');
  const includeIndirectPrerequisites =
    document.getElementById('includeIndirectPrerequisites');
  const indirectPrerequisiteTextbox =
    document.getElementById('indirectPrerequisiteData');

  if (
    !includeDirectPrerequisites.checked &&
    !includeIndirectPrerequisites.checked
  ) {
    await showDialog(
      'Please select Prerequisites, Indirect Evidence, or both before processing.'
    );
    return;
  }

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData) {
    await showDialog(
      'Please paste and confirm the Class Roster data before processing prerequisites.'
    );
    return;
  }

  if (
    includeDirectPrerequisites.checked &&
    !directPrerequisiteData
  ) {
    await showDialog(
      'Please paste and successfully process the direct Prerequisite data before continuing.'
    );
    return;
  }

  if (includeIndirectPrerequisites.checked) {
    const indirectText = indirectPrerequisiteTextbox.value.trim();

    if (!indirectText) {
      if (
        includeDirectPrerequisites.checked &&
        directPrerequisiteData
      ) {
        const continueWithoutIndirect = await showDialog(
          'No Indirect Prerequisite Checker data has been provided.<br><br>You can continue using the official prerequisite data already processed, or go back and paste the Indirect Prerequisite Checker page.',
          true,
          {
            closeLabel: 'Go Back',
            confirmLabel: 'Continue Without Indirect Evidence',
          }
        );

        if (!continueWithoutIndirect) {
          return;
        }

        disableIndirectEvidence(includeIndirectPrerequisites);
      } else {
        await showDialog(
          'Indirect Evidence is selected, but no Indirect Prerequisite Checker data has been provided.<br><br>Paste the Indirect Prerequisite Checker page, or select Prerequisites instead.'
        );
        return;
      }
    } else if (!indirectPrerequisiteData) {
      await showDialog(
        'Indirect Prerequisite Checker data was pasted but did not process successfully.<br><br>Please review the pasted data before continuing.'
      );
      return;
    }
  }

  generateHTMLTable();

  document.getElementById('tableContainer').style.display = 'block';
  document
    .getElementById('tableContainer')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
}
