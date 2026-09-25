// parseRosterData.js
import { setRosterData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { parseRosterText } from './rosterParser.js';
import { escapeHTML } from './htmlUtils.js';
import { recordDiagnostic, setDiagnosticState } from './diagnostics.js';

function rosterVariantLabel(variant) {
  if (variant === 'faculty') {
    return 'Faculty';
  }

  if (variant === 'admin') {
    return 'Admin';
  }

  return 'Unknown';
}

export async function parseRosterData() {
  const rosterTextbox = document.getElementById('rosterData');
  const rawText = rosterTextbox.value;
  const result = parseRosterText(rawText);

  if (!result.ok) {
    setRosterData(null);
    setDiagnosticState({
      rosterAccepted: false,
      rosterVariant: null,
      outputGenerated: false,
    });
    recordDiagnostic('roster-parse-failed', {
      variant: result.variant,
      code: result.code,
    });
    updateStatusIndicator(
      'rosterStatus',
      'Unable to process roster data.',
      'bad'
    );

    await showDialog(
      `Unable to process the Class Roster.<br><br><strong>Reason:</strong> ${escapeHTML(result.message)}<br><br>Please confirm that you copied the complete roster page.`
    );

    rosterTextbox.value = '';
    return null;
  }

  const {
    variant,
    professor,
    course,
    lecNum,
    labNum,
  } = result.data;

  const confirmed = await showDialog(
    `Is this information correct?<br>
    <strong>Roster Type:</strong> ${rosterVariantLabel(variant)}<br>
    <strong>Professor:</strong> ${escapeHTML(professor || 'N/A')}<br>
    <strong>Course:</strong> ${escapeHTML(course || 'N/A')}<br>
    <strong>LEC Number:</strong> ${escapeHTML(lecNum || 'N/A')}<br>
    <strong>LAB Number:</strong> ${escapeHTML(labNum || 'N/A')}`,
    true
  );

  if (!confirmed) {
    rosterTextbox.value = '';
    setRosterData(null);
    setDiagnosticState({
      rosterAccepted: false,
      rosterVariant: null,
      outputGenerated: false,
    });
    recordDiagnostic('roster-confirmation-cancelled', {
      variant,
    });

    updateStatusIndicator(
      'rosterStatus',
      'Roster data processing cancelled by user.',
      'bad'
    );

    return null;
  }

  setRosterData(result.data);
  setDiagnosticState({
    rosterAccepted: true,
    rosterVariant: variant,
    directAccepted: false,
    directVariant: null,
    indirectAccepted: false,
    indirectVariant: null,
    outputGenerated: false,
  });
  recordDiagnostic('roster-accepted', { variant });

  const overlay = document.getElementById('disableUntilRosterAccepted');

  if (overlay) {
    overlay.style.display = 'none';
  }

  updateStatusIndicator(
    'rosterStatus',
    `${rosterVariantLabel(variant)} roster data processed successfully.`,
    'good'
  );

  return result.data;
}
