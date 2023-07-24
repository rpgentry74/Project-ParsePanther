// prerequisiteDataHandler.js
import { parseClassData } from './parseClassData.js'; 

export function handlePrerequisiteDataPaste() {
  // Get the prerequisite data textbox
  const prerequisiteDataTextbox = document.getElementById('prerequisiteData');

  // Attach the on paste event listener
  prerequisiteDataTextbox.addEventListener('paste', async (event) => { // Add async here
    // Wait until after the paste event has completed before validating the pasted data
    setTimeout(async () => { // Add async here
      // Get the pasted data from the textbox
      const pastedText = prerequisiteDataTextbox.value;

      // Parse and validate the pasted prerequisite data
      try {
        await parseClassData(pastedText); // await the promise
      } catch (error) {
        console.error("Error occurred while parsing class data:", error.message);
      }
    }, 100);
  });
}
