// inputValidation.js

export function restrictToPaste(inputId) {
  const input = document.getElementById(inputId);

  if (!input) {
    return;
  }

  // Keep the fields paste-only without trapping keyboard navigation.
  // beforeinput fires only when content is about to change, so Tab,
  // arrow keys, selection shortcuts, and assistive-technology navigation
  // remain available.
  input.addEventListener('beforeinput', (event) => {
    if (event.inputType !== 'insertFromPaste') {
      event.preventDefault();
    }
  });
}
