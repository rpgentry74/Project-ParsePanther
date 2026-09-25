// main.js
import { showNewMessages } from './messageSystem.js';
import {
  handleFormReset,
  handleRosterReset,
  handlePrerequisiteReset,
  handleIndirectPrerequisiteReset,
} from './resetHandler.js';
import { handleFormSubmission } from './formHandler.js';
import { registerServiceWorker } from './registerServiceWorker.js';
import { handleRosterDataPaste } from './rosterDataHandler.js';
import { handlePrerequisiteDataPaste } from './prerequisiteDataHandler.js';
import { handleIndirectPrerequisiteDataPaste } from './indirectPrerequisiteDataHandler.js';
import { restrictToPaste } from './inputValidation.js';
import { initializePrerequisiteOptions } from './checkboxes.js';
import './generateSpreadsheetFile.js';
import { initializeDiagnostics, setDiagnosticState } from './diagnostics.js';

// Attach button handlers once, from the application entry point.
document.getElementById('submit').addEventListener('click', handleFormSubmission);
document.getElementById('resetAll').addEventListener('click', handleFormReset);
document.getElementById('resetRoster').addEventListener('click', handleRosterReset);
document.getElementById('resetPrerequisite').addEventListener('click', handlePrerequisiteReset);
document.getElementById('resetIndirectPrerequisite').addEventListener('click', handleIndirectPrerequisiteReset);

// Initialize privacy-safe session diagnostics before the workflow starts.
initializeDiagnostics();

// Initialize prerequisite option controls.
initializePrerequisiteOptions();
setDiagnosticState({
  directSelected: document.getElementById('includeDirectPrerequisites').checked,
  indirectSelected: document.getElementById('includeIndirectPrerequisites').checked,
});

// Handle pasted data.
handleRosterDataPaste();
handlePrerequisiteDataPaste();
handleIndirectPrerequisiteDataPaste();

// Prevent manual data entry for the roster and prerequisite data textareas.
restrictToPaste('rosterData');
restrictToPaste('prerequisiteData');
restrictToPaste('indirectPrerequisiteData');

// Register service worker.
registerServiceWorker();

// Show user messages on initial page load.
showNewMessages();
