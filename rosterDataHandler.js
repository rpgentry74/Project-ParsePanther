// rosterDataHandler.js
import { parseRosterData } from './parseRosterData.js';
import { invalidateForRosterPaste } from './resetHandler.js';

export function handleRosterDataPaste() {
  const rosterDataTextbox = document.getElementById('rosterData');

  rosterDataTextbox.addEventListener('paste', () => {
    invalidateForRosterPaste();

    // Wait until the browser has placed the pasted text in the textarea.
    setTimeout(() => {
      parseRosterData();
    }, 100);
  });
}
