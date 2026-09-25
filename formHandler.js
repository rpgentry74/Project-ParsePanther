// formHandler.js
import { generateHTMLTable } from './generateHTMLTable.js';
import { showDialog } from './dialogHandler.js';
import { getState } from './state.js';

export function handleFormSubmission() {
  const includeDirectPrerequisites = document.getElementById('includeDirectPrerequisites');
  const includeIndirectPrerequisites = document.getElementById('includeIndirectPrerequisites');

  if (!includeDirectPrerequisites.checked && !includeIndirectPrerequisites.checked) {
    showDialog('Please select Prerequisites, Indirect Evidence, or both before processing.');
    return;
  }

  const {
    rosterData,
    directPrerequisiteData,
    indirectPrerequisiteData,
  } = getState();

  if (!rosterData) {
    showDialog('Please paste and confirm the Class Roster data before processing prerequisites.');
    return;
  }

  if (includeDirectPrerequisites.checked && !directPrerequisiteData) {
    showDialog('Please paste and successfully process the direct Prerequisite data before continuing.');
    return;
  }

  if (includeIndirectPrerequisites.checked && !indirectPrerequisiteData) {
    showDialog('Please paste and successfully process the Indirect Prerequisite Checker data before continuing.');
    return;
  }

  generateHTMLTable();

  document.getElementById('tableContainer').style.display = 'block';
  document.getElementById('tableContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
