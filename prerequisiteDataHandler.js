// prerequisiteDataHandler.js
import { parseClassData } from './parseClassData.js';
import { invalidateForDirectPrerequisitePaste } from './resetHandler.js';

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
      console.error('Error occurred while parsing direct prerequisite data:', error.message);
    }
  });
}
