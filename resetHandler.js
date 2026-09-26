// resetHandler.js
import { resetState, setDirectPrerequisiteData, setIndirectPrerequisiteData } from './state.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { recordDiagnostic, setDiagnosticState } from './diagnostics.js';
import { destroyWideTableSupport } from './wideTableSupport.js';

export function clearGeneratedOutput() {
  destroyWideTableSupport();
  document.getElementById('output').innerHTML = '';
  document.getElementById('tableContainer').style.display = 'none';
  setDiagnosticState({ outputGenerated: false });
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
  recordDiagnostic('roster-paste-received');
  setDiagnosticState({
    rosterAccepted: false,
    rosterVariant: null,
    directAccepted: false,
    directVariant: null,
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });

  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetState();
  resetAllStatuses();
  updateStatusIndicator('rosterStatus', 'Processing pasted data...', 'default');

  restoreRosterOverlay();
  clearGeneratedOutput();
}

export function invalidateForDirectPrerequisitePaste() {
  recordDiagnostic('direct-paste-received');
  setDiagnosticState({
    directAccepted: false,
    directVariant: null,
    outputGenerated: false,
  });
  setDirectPrerequisiteData(null);
  updateStatusIndicator('prerequisiteStatus', 'Processing pasted data...', 'default');
  clearGeneratedOutput();
}

export function invalidateForIndirectPrerequisitePaste() {
  recordDiagnostic('indirect-paste-received');
  setDiagnosticState({
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });
  setIndirectPrerequisiteData(null);
  updateStatusIndicator('indirectPrerequisiteStatus', 'Processing pasted data...', 'default');
  clearGeneratedOutput();
}

export function handleRosterReset() {
  recordDiagnostic('roster-reset');
  setDiagnosticState({
    rosterAccepted: false,
    rosterVariant: null,
    directAccepted: false,
    directVariant: null,
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });

  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
  clearGeneratedOutput();
}

export function handlePrerequisiteReset() {
  recordDiagnostic('direct-reset');
  setDiagnosticState({
    directAccepted: false,
    directVariant: null,
    outputGenerated: false,
  });

  resetTextarea('prerequisiteData');
  updateStatusIndicator('prerequisiteStatus', 'No data processed yet.', 'default');
  setDirectPrerequisiteData(null);
  clearGeneratedOutput();
}

export function handleIndirectPrerequisiteReset() {
  recordDiagnostic('indirect-reset');
  setDiagnosticState({
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });

  resetTextarea('indirectPrerequisiteData');
  updateStatusIndicator('indirectPrerequisiteStatus', 'No data processed yet.', 'default');
  setIndirectPrerequisiteData(null);
  clearGeneratedOutput();
}

export function handleFormReset() {
  recordDiagnostic('all-fields-reset');
  setDiagnosticState({
    rosterAccepted: false,
    rosterVariant: null,
    directAccepted: false,
    directVariant: null,
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });

  resetTextarea('rosterData');
  resetTextarea('prerequisiteData');
  resetTextarea('indirectPrerequisiteData');

  resetAllStatuses();
  resetState();
  restoreRosterOverlay();
  clearGeneratedOutput();
}
