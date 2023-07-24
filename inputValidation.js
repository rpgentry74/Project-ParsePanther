// inputValidation.js

export function allowOnlyPaste(inputId) {
    const input = document.getElementById(inputId);
  
    // Allow only paste operations in the input
    input.addEventListener('keydown', function(event) {
      if (event.key !== 'v' || !(event.ctrlKey || event.metaKey)) {
        // If it's not a paste operation, prevent the default action
        event.preventDefault();
      }
    });
  }
  