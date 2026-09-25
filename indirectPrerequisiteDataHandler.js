// indirectPrerequisiteDataHandler.js
import { parseIndirectClassData } from './parseIndirectClassData.js';
import { invalidateForIndirectPrerequisitePaste } from './resetHandler.js';

export function handleIndirectPrerequisiteDataPaste() {
  const indirectPrerequisiteDataTextbox = document.getElementById('indirectPrerequisiteData');

  indirectPrerequisiteDataTextbox.addEventListener('paste', () => {
    invalidateForIndirectPrerequisitePaste();

    // Wait until the browser has placed the pasted text in the textarea.
    setTimeout(async () => {
      try {
        await parseIndirectClassData();
      } catch (error) {
        console.error('Error occurred while parsing indirect prerequisite data:', error.message);
      }
    }, 100);
  });
}
