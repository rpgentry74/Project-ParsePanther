export function showDialog(message, withConfirmation = false) {
  return new Promise((resolve) => {
    // If there's already a dialog, remove it
    const existingDialog = document.querySelector('.dialog');
    if (existingDialog) existingDialog.remove();

    // Create dialog elements
    const dialog = document.createElement('div');
    const messageElement = document.createElement('p');
    const closeButton = document.createElement('button');
    let confirmButton;

    // Set element content
    messageElement.innerHTML = message; // changed from textContent to innerHTML
    closeButton.textContent = 'Close';

    if (withConfirmation) {
      confirmButton = document.createElement('button');
      confirmButton.textContent = 'Confirm';
    }

    // Set element classes for styling
    dialog.className = 'dialog';
    messageElement.className = 'dialog-message';
    closeButton.className = 'dialog-button';

    if (confirmButton) {
      confirmButton.className = 'dialog-button confirm';
    }

    // Set the role attribute for the dialog
    dialog.setAttribute('role', 'dialog');

    // Add close functionality to button
    closeButton.addEventListener('click', () => closeDialog(false));
    if (confirmButton) {
      confirmButton.addEventListener('click', () => closeDialog(true));
    }

    // Close the dialog box when 'Esc' key is pressed
    document.addEventListener('keydown', escKeyListener);

    // Append elements
    dialog.appendChild(messageElement);
    dialog.appendChild(closeButton);
    if (confirmButton) {
      dialog.appendChild(confirmButton);
    }

    // Append dialog to body
    document.body.appendChild(dialog);

    // Move focus to the dialog or the close button
    closeButton.focus();

    // Function to handle 'Esc' key event
    function escKeyListener(e) {
      if (e.key === 'Escape') {
        closeDialog(false);
      }
    }

    // Function to close the dialog
    function closeDialog(confirmed) {
      dialog.remove();
      document.removeEventListener('keydown', escKeyListener);
      resolve(confirmed);
    }
  });
}