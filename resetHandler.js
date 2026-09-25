// resetHandler.js
import { resetState, setDirectPrerequisiteData, setIndirectPrerequisiteData } from './state.js';
import { updateStatusIndicator } from './statusIndicator.js';

export function clearGeneratedOutput() {
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

export function invalidateForRosterPaste() {
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetState();
  resetAllStatuses();
  updateStatusIndicator('rosterStatus', 'Processing pasted data...', 'default');

  restoreRosterOverlay();
  clearGeneratedOutput();
}

export function invalidateForDirectPrerequisitePaste() {
  setDirectPrerequisiteData(null);
  updateStatusIndicator('prerequisiteStatus', 'Processing pasted data...', 'default');
  clearGeneratedOutput();
}

export function invalidateForIndirectPrerequisitePaste() {
  setIndirectPrerequisiteData(null);
  updateStatusIndicator('indirectPrerequisiteStatus', 'Processing pasted data...', 'default');
  clearGeneratedOutput();
}

export function handleRosterReset() {
  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
  clearGeneratedOutput();
}

export function handlePrerequisiteReset() {
  resetTextarea('prerequisiteData');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  setDirectPrerequisiteData(null);
  clearGeneratedOutput();
}

export function handleIndirectPrerequisiteReset() {
  resetTextarea('indirectPrerequisiteData');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');
  setIndirectPrerequisiteData(null);
  clearGeneratedOutput();
}

export function handleFormReset() {
  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
  clearGeneratedOutput();
}
