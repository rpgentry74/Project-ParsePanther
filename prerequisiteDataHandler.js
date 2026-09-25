// prerequisiteDataHandler.js
import { parseClassData } from './parseClassData.js';
import { invalidateForDirectPrerequisitePaste } from './resetHandler.js';

export function handlePrerequisiteDataPaste() {
  const prerequisiteDataTextbox = document.getElementById('prerequisiteData');

  prerequisiteDataTextbox.addEventListener('paste', () => {
    invalidateForDirectPrerequisitePaste();

    // Wait until the browser has placed the pasted text in the textarea.
    setTimeout(async () => {
      try {
        await parseClassData();
      } catch (error) {
        console.error('Error occurred while parsing direct prerequisite data:', error.message);
      }
    }, 100);
  });
}
