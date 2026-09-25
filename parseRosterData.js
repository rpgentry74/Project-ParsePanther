// parseRosterData.js
import { setRosterData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { parseRosterText } from './rosterParser.js';

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
    updateStatusIndicator(
      'rosterStatus',
      'Unable to process roster data.',
      'bad'
    );

    await showDialog(
      `Unable to process the Class Roster.<br><br><strong>Reason:</strong> ${result.message}<br><br>Please confirm that you copied the complete roster page.`
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
    <strong>Professor:</strong> ${professor || 'N/A'}<br>
    <strong>Course:</strong> ${course || 'N/A'}<br>
    <strong>LEC Number:</strong> ${lecNum || 'N/A'}<br>
    <strong>LAB Number:</strong> ${labNum || 'N/A'}`,
    true
  );

  if (!confirmed) {
    rosterTextbox.value = '';
    setRosterData(null);

    updateStatusIndicator(
      'rosterStatus',
      'Roster data processing cancelled by user.',
      'bad'
    );

    return null;
  }

  setRosterData(result.data);

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
