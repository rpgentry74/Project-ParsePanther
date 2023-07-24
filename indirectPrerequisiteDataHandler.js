// indirectPrerequisiteDataHandler.js
import { parseIndirectClassData } from './parseIndirectClassData.js';

export function handleIndirectPrerequisiteDataPaste() {
  // Get the indirect prerequisite data textbox
  const indirectPrerequisiteDataTextbox = document.getElementById('indirectPrerequisiteData');

  // Attach the on paste event listener
  indirectPrerequisiteDataTextbox.addEventListener('paste', async (event) => {
    // Wait until after the paste event has completed before validating the pasted data
    setTimeout(async () => {
      // Parse and validate the pasted indirect prerequisite data
      try {
        await parseIndirectClassData();
        console.log("Successfully parsed indirect prerequisite data!");
      } catch (error) {
        console.error("Error occurred while parsing indirect prerequisite data: ", error);
      }
    }, 100);
  });
}
