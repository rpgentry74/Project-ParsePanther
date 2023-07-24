// main.js
import { showNewMessages } from './messageSystem.js';
import { handleFormReset, resetTextarea } from './resetHandler.js';
import { handleFormSubmission } from './formHandler.js';
import { registerServiceWorker } from './registerServiceWorker.js';
import { handleRosterDataPaste } from './rosterDataHandler.js';
import { handlePrerequisiteDataPaste } from './prerequisiteDataHandler.js';
import { handleIndirectPrerequisiteDataPaste } from './indirectPrerequisiteDataHandler.js';
import { allowOnlyPaste } from './inputValidation.js';

// Attach the onSubmit function to the submit button
document.getElementById('submit').addEventListener('click', handleFormSubmission);

// Attach the onReset function to the reset button
document.getElementById('resetAll').addEventListener('click', handleFormReset);

// Attach the reset handlers to the individual reset buttons
document.getElementById('resetRoster').addEventListener('click', () => resetTextarea('rosterData'));
document.getElementById('resetPrerequisite').addEventListener('click', () => resetTextarea('prerequisiteData'));
document.getElementById('resetIndirectPrerequisite').addEventListener('click', () => resetTextarea('indirectPrerequisiteData'));

// Handle roster data paste
handleRosterDataPaste();

// Handle prerequisite data paste
handlePrerequisiteDataPaste(); // Call the function

// Handle prerequisite data paste
handleIndirectPrerequisiteDataPaste(); // Call the function

// Prevent manual data entry for the roster and prerequisite data textareas
allowOnlyPaste('rosterData');
allowOnlyPaste('prerequisiteData');
allowOnlyPaste('indirectPrerequisiteData');

// Register service worker
registerServiceWorker();

// Show user messages on initial load of the page.
showNewMessages();
