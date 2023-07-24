// rosterDataHandler.js
import { parseRosterData } from './parseRosterData.js';

export function handleRosterDataPaste() {
    // Get the roster data textbox
    const rosterDataTextbox = document.getElementById('rosterData');
  
    // Attach the on paste event listener
    rosterDataTextbox.addEventListener('paste', (event) => {
      // Wait until after the paste event has completed before validating the pasted data
      setTimeout(() => {
        // Get the pasted data from the textbox
        const pastedText = rosterDataTextbox.value;
  
        // Parse and validate the pasted roster data
        parseRosterData(pastedText);
      }, 100);
    });
  }
  
