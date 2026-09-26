// rosterDataHandler.js
import { parseRosterData } from './parseRosterData.js';
import { invalidateForRosterPaste } from './resetHandler.js';
import { showDialog } from './dialogHandler.js';
import { recordDiagnostic } from './diagnostics.js';

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
      recordDiagnostic('unexpected-application-error', {
        code: 'ROSTER_PASTE_HANDLER',
        source: 'rosterDataHandler.js',
      });
      console.error('Unexpected error while processing roster:', error);
      await showDialog(
        'An unexpected application error occurred while processing the Class Roster. No roster result was accepted. If the problem continues, open Support Diagnostics and include the report when contacting support.'
      );
    }
  });
}
