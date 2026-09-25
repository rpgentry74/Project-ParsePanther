// parseClassData.js
import { getState, setDirectPrerequisiteData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { parseDirectPrerequisiteText } from './directPrerequisiteParser.js';
import { escapeHTML } from './htmlUtils.js';

function cleanComparable(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sectionNumbersMatch(parsedValue, rosterValue) {
  const parsed = cleanComparable(parsedValue);
  const roster = cleanComparable(rosterValue);

  if (!parsed && !roster) {
    return true;
  }

  return parsed === roster;
}

function directVariantLabel(variant) {
  if (variant === 'faculty') {
    return 'Faculty';
  }

  if (variant === 'admin') {
    return 'Admin';
  }

  return 'Unknown';
}

function classContextMatches(parsed, rosterData) {
  return (
    cleanComparable(parsed.professor) === cleanComparable(rosterData.professor) &&
    cleanComparable(parsed.course) === cleanComparable(rosterData.course) &&
    sectionNumbersMatch(parsed.lecNum, rosterData.lecNum) &&
    sectionNumbersMatch(parsed.labNum, rosterData.labNum)
  );
}

export async function parseClassData() {
  const prerequisiteTextbox = document.getElementById('prerequisiteData');
  const rawText = prerequisiteTextbox.value;
  const result = parseDirectPrerequisiteText(rawText);

  if (!result.ok) {
    setDirectPrerequisiteData(null);

    updateStatusIndicator(
      'prerequisiteStatus',
      'Unable to process direct prerequisite data.',
      'bad'
    );

    await showDialog(
      `ParsePanther could not safely determine the direct prerequisites from this page.<br><br><strong>Reason:</strong> ${escapeHTML(result.message)}<br><br>No prerequisite determination was made.`
    );

    prerequisiteTextbox.value = '';
    return null;
  }

  const rosterData = getState().rosterData;

  if (!rosterData) {
    setDirectPrerequisiteData(null);

    updateStatusIndicator(
      'prerequisiteStatus',
      'Class Roster data is required first.',
      'bad'
    );

    await showDialog(
      'Please paste and confirm the Class Roster before processing direct prerequisite data.'
    );

    prerequisiteTextbox.value = '';
    return null;
  }

  const parsed = result.data;

  if (!classContextMatches(parsed, rosterData)) {
    setDirectPrerequisiteData(null);

    updateStatusIndicator(
      'prerequisiteStatus',
      'Direct prerequisite data does not match the roster.',
      'bad'
    );

    await showDialog(
      `The direct prerequisite data does not match the confirmed Class Roster:<br>
      <strong>Professor:</strong> ${escapeHTML(parsed.professor || 'N/A')} vs ${escapeHTML(rosterData.professor || 'N/A')}<br>
      <strong>Course:</strong> ${escapeHTML(parsed.course || 'N/A')} vs ${escapeHTML(rosterData.course || 'N/A')}<br>
      <strong>LEC Number:</strong> ${escapeHTML(parsed.lecNum || 'N/A')} vs ${escapeHTML(rosterData.lecNum || 'N/A')}<br>
      <strong>LAB Number:</strong> ${escapeHTML(parsed.labNum || 'N/A')} vs ${escapeHTML(rosterData.labNum || 'N/A')}`
    );

    prerequisiteTextbox.value = '';
    return null;
  }

  if (parsed.requiresNoPrerequisiteConfirmation) {
    const confirmed = await showDialog(
      `ParsePanther found the Direct Prerequisite section for this class, but did not recognize any prerequisite courses.<br><br>If no Direct Prerequisite courses are listed on the LRCCD page, select <strong>Confirm</strong> to continue with no Direct Prerequisites.<br><br>If prerequisite courses are listed, select <strong>Close</strong>. The page format may have changed and should be reviewed.`,
      true
    );

    if (!confirmed) {
      setDirectPrerequisiteData(null);

      updateStatusIndicator(
        'prerequisiteStatus',
        'Direct prerequisite page requires review.',
        'bad'
      );

      prerequisiteTextbox.value = '';
      return null;
    }

    parsed.confirmedNoDirectPrerequisites = true;
  }

  setDirectPrerequisiteData(parsed);

  updateStatusIndicator(
    'prerequisiteStatus',
    parsed.confirmedNoDirectPrerequisites
      ? `${directVariantLabel(parsed.variant)} direct prerequisite page processed successfully. No direct prerequisites listed (confirmed).`
      : `${directVariantLabel(parsed.variant)} direct prerequisite data processed successfully.`,
    'good'
  );

  return parsed;
}
