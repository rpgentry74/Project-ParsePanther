// indirectPrerequisiteDataHandler.js
import { parseIndirectClassData } from './parseIndirectClassData.js';
import { invalidateForIndirectPrerequisitePaste } from './resetHandler.js';

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
      console.error('Error occurred while parsing indirect prerequisite data:', error.message);
    }
  });
}
