// resetHandler.js
import { resetState, setRosterData, setClassData, setIndirectClassData } from './state.js';
import { updateStatusIndicator } from './statusIndicator.js';

export function handleFormReset() {
  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');
  document.getElementById('output').innerHTML = '';
  
  // Hide the download button and format dropdown
  document.getElementById('tableContainer').style.display = 'none';
  
  // Reset state
  resetState();
}

export function resetTextarea(textareaId) {
  document.getElementById(textareaId).value = '';
}

// Reset roster data button
resetRoster.addEventListener('click', function() {
  // Clear all the textboxes
  document.getElementById('rosterData').value = '';
  document.getElementById('prerequisiteData').value = '';
  document.getElementById('indirectPrerequisiteData').value = '';

  // Reset all the status messages
  updateStatusIndicator('rosterStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');

  resetState(); // Reset all the data in the state

  // Add the overlay back
  document.getElementById('disableUntilRosterAccepted').style.display = 'block';
});

// Reset prerequisite data button
resetPrerequisite.addEventListener('click', function() {
  document.getElementById('prerequisiteData').value = '';
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  setClassData(null); // Reset the prerequisite data in the state
});

// Reset indirect prerequisite data button
resetIndirectPrerequisite.addEventListener('click', function() {
  document.getElementById('indirectPrerequisiteData').value = '';
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');
  setIndirectClassData(null); // Reset the indirect prerequisite data in the state
});

// Reset all fields button
resetAll.addEventListener('click', function() {
  // Clear all the textboxes
  document.getElementById('rosterData').value = '';
  document.getElementById('prerequisiteData').value = '';
  document.getElementById('indirectPrerequisiteData').value = '';

  // Reset all the status messages
  updateStatusIndicator('rosterStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');

  resetState(); // Reset all the data in the state

  // Add the overlay back
  document.getElementById('disableUntilRosterAccepted').style.display = 'block';
});