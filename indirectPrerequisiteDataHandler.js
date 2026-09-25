// indirectPrerequisiteDataHandler.js
import { parseIndirectClassData } from './parseIndirectClassData.js';
import { invalidateForIndirectPrerequisitePaste } from './resetHandler.js';
import { showDialog } from './dialogHandler.js';
import { recordDiagnostic } from './diagnostics.js';

export function handleIndirectPrerequisiteDataPaste() {
  const textbox = document.getElementById('indirectPrerequisiteData');

  textbox.addEventListener('paste', async (event) => {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text/plain') || '';

    invalidateForIndirectPrerequisitePaste();
    textbox.value = pastedText;

    try {
      await parseIndirectClassData();
    } catch (error) {
      recordDiagnostic('unexpected-application-error', {
        code: 'INDIRECT_PASTE_HANDLER',
        source: 'indirectPrerequisiteDataHandler.js',
      });
      console.error('Unexpected error while processing Indirect Evidence data:', error);
      await showDialog(
        'An unexpected application error occurred while processing the Indirect Prerequisite Checker data. No Indirect Evidence result was accepted. If the problem continues, open Support Diagnostics and include the report when contacting support.'
      );
    }
  });
}
