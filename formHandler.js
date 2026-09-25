// formHandler.js
import { generateHTMLTable } from './generateHTMLTable.js';
import { showDialog } from './dialogHandler.js';
import { getState } from './state.js';

export async function handleFormSubmission() {
  const includeDirectPrerequisites = document.getElementById('includeDirectPrerequisites');
  const includeIndirectPrerequisites = document.getElementById('includeIndirectPrerequisites');

  if (!includeDirectPrerequisites.checked && !includeIndirectPrerequisites.checked) {
    showDialog('Please select at least one type of prerequisite to include.');
    return;
  }

  const { rosterData, classData, indirectClassData } = getState();

  if (!rosterData) {
    showDialog('Please paste and confirm the Class Roster data before processing prerequisites.');
    return;
  }

  if (includeDirectPrerequisites.checked && !classData) {
    showDialog('Please paste and successfully process the direct Prerequisite data before continuing.');
    return;
  }

  if (includeIndirectPrerequisites.checked && !indirectClassData) {
    showDialog('Please paste and successfully process the Indirect Prerequisite data before continuing.');
    return;
  }

  const htmlTable = await generateHTMLTable();
  document.getElementById('output').innerHTML = htmlTable;
  document.getElementById('tableContainer').style.display = 'block';
  document.getElementById('downloadBtn').scrollIntoView({ behavior: 'smooth' });
}
