// parseIndirectClassData.js
import { getState, setIndirectPrerequisiteData } from './state.js';
import { showDialog } from './dialogHandler.js';
import { updateStatusIndicator } from './statusIndicator.js';
import { parseIndirectPrerequisiteText } from './indirectPrerequisiteParser.js';
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

function classContextMatches(parsed, rosterData) {
  return (
    cleanComparable(parsed.professor) === cleanComparable(rosterData.professor) &&
    cleanComparable(parsed.course) === cleanComparable(rosterData.course) &&
    sectionNumbersMatch(parsed.lecNum, rosterData.lecNum) &&
    sectionNumbersMatch(parsed.labNum, rosterData.labNum)
  );
}

function indirectVariantLabel(variant) {
  if (variant === 'faculty') {
    return 'Faculty';
  }

  if (variant === 'admin') {
    return 'Admin';
  }

  return 'Unknown';
}

export async function parseIndirectClassData() {
  const textbox = document.getElementById('indirectPrerequisiteData');
  const rawText = textbox.value;
  const result = parseIndirectPrerequisiteText(rawText);

  if (!result.ok) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Unable to process indirect prerequisite data.',
      'bad'
    );

    await showDialog(
      `ParsePanther could not safely determine the indirect prerequisites from this page.<br><br><strong>Reason:</strong> ${escapeHTML(result.message)}<br><br>No prerequisite determination was made.`
    );

    textbox.value = '';
    return null;
  }

  const rosterData = getState().rosterData;

  if (!rosterData) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Class Roster data is required first.',
      'bad'
    );

    await showDialog(
      'Please paste and confirm the Class Roster before processing indirect prerequisite data.'
    );

    textbox.value = '';
    return null;
  }

  const parsed = result.data;

  if (!classContextMatches(parsed, rosterData)) {
    setIndirectPrerequisiteData(null);

    updateStatusIndicator(
      'indirectPrerequisiteStatus',
      'Indirect prerequisite data does not match the roster.',
      'bad'
    );

    await showDialog(
      `The indirect prerequisite data does not match the confirmed Class Roster:<br>
      <strong>Professor:</strong> ${escapeHTML(parsed.professor || 'N/A')} vs ${escapeHTML(rosterData.professor || 'N/A')}<br>
      <strong>Course:</strong> ${escapeHTML(parsed.course || 'N/A')} vs ${escapeHTML(rosterData.course || 'N/A')}<br>
      <strong>LEC Number:</strong> ${escapeHTML(parsed.lecNum || 'N/A')} vs ${escapeHTML(rosterData.lecNum || 'N/A')}<br>
      <strong>LAB Number:</strong> ${escapeHTML(parsed.labNum || 'N/A')} vs ${escapeHTML(rosterData.labNum || 'N/A')}`
    );

    textbox.value = '';
    return null;
  }

  setIndirectPrerequisiteData(parsed);

  updateStatusIndicator(
    'indirectPrerequisiteStatus',
    `${indirectVariantLabel(parsed.variant)} indirect prerequisite data processed successfully.`,
    'good'
  );

  return parsed;
}
