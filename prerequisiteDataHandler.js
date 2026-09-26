// prerequisiteDataHandler.js
import { parseClassData } from './parseClassData.js';
import { invalidateForDirectPrerequisitePaste } from './resetHandler.js';
import { showDialog } from './dialogHandler.js';
import { recordDiagnostic } from './diagnostics.js';

export function handlePrerequisiteDataPaste() {
  const textbox = document.getElementById('prerequisiteData');

  textbox.addEventListener('paste', async (event) => {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text/plain') || '';

    invalidateForDirectPrerequisitePaste();
    textbox.value = pastedText;

    try {
      await parseClassData();
    } catch (error) {
      recordDiagnostic('unexpected-application-error', {
        code: 'PREREQUISITE_PASTE_HANDLER',
        source: 'prerequisiteDataHandler.js',
      });
      console.error('Unexpected error while processing prerequisite data:', error);
      await showDialog(
        'An unexpected application error occurred while processing the Prerequisite Checker data. No prerequisite result was accepted. If the problem continues, open Support Diagnostics and include the report when contacting support.'
      );
    }
  });
}
