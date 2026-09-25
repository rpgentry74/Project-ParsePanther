// rosterDataHandler.js
import { parseRosterData } from './parseRosterData.js';
import { invalidateForRosterPaste } from './resetHandler.js';

export function handleRosterDataPaste() {
  const textbox = document.getElementById('rosterData');

  textbox.addEventListener('paste', async (event) => {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text/plain') || '';

    invalidateForRosterPaste();
    textbox.value = pastedText;

    try {
      await parseRosterData();
    } catch (error) {
      console.error('Error occurred while parsing roster data:', error.message);
    }
  });
}
