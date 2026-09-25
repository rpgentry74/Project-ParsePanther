// resetHandler.js
import { resetState, setClassData, setIndirectClassData } from './state.js';
import { updateStatusIndicator } from './statusIndicator.js';

function clearOutput() {
  document.getElementById('output').innerHTML = '';
  document.getElementById('tableContainer').style.display = 'none';
}

function resetAllStatuses() {
  updateStatusIndicator('rosterStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');
}

function restoreRosterOverlay() {
  const overlay = document.getElementById('disableUntilRosterAccepted');
  if (overlay) {
    overlay.style.display = 'block';
  }
}

export function resetTextarea(textareaId) {
  document.getElementById(textareaId).value = '';
}

export function handleRosterReset() {
  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
}

export function handlePrerequisiteReset() {
  resetTextarea('prerequisiteData');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  setClassData(null);
}

export function handleIndirectPrerequisiteReset() {
  resetTextarea('indirectPrerequisiteData');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');
  setIndirectClassData(null);
}

export function handleFormReset() {
  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
  clearOutput();
}
