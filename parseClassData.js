// parseClassData.js
import { getState, setDirectPrerequisiteData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { parseDirectPrerequisiteText } from './directPrerequisiteParser.js';

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
      `ParsePanther could not safely determine the direct prerequisites from this page.<br><br><strong>Reason:</strong> ${result.message}<br><br>No prerequisite determination was made.`
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
      <strong>Professor:</strong> ${parsed.professor || 'N/A'} vs ${rosterData.professor || 'N/A'}<br>
      <strong>Course:</strong> ${parsed.course || 'N/A'} vs ${rosterData.course || 'N/A'}<br>
      <strong>LEC Number:</strong> ${parsed.lecNum || 'N/A'} vs ${rosterData.lecNum || 'N/A'}<br>
      <strong>LAB Number:</strong> ${parsed.labNum || 'N/A'} vs ${rosterData.labNum || 'N/A'}`
    );

    prerequisiteTextbox.value = '';
    return null;
  }

  setDirectPrerequisiteData(parsed);

  updateStatusIndicator(
    'prerequisiteStatus',
    `${directVariantLabel(parsed.variant)} direct prerequisite data processed successfully.`,
    'good'
  );

  return parsed;
}
