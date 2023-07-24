export function showDialog(message, withConfirmation = true) {
  return new Promise((resolve) => {
    // If there's already a dialog, remove it
    const existingDialog = document.querySelector('.dialog');
    if (existingDialog) existingDialog.remove();

    // Create dialog elements
    const dialog = document.createElement('div');
    const messageElement = document.createElement('p');
    const closeButton = document.createElement('button');
    const remindLaterButton = document.createElement('button');

    // Set element content
    messageElement.innerHTML = message; // changed from textContent to innerHTML
    closeButton.textContent = 'Don\'t show again';
    remindLaterButton.textContent = 'Remind me later';

    // Set element classes for styling
    dialog.className = 'dialog';
    messageElement.className = 'dialog-message';
    closeButton.className = 'dialog-button';
    remindLaterButton.className = 'dialog-button remind-later';

    // Set the role attribute for the dialog
    dialog.setAttribute('role', 'dialog');

    // Add close functionality to button
    closeButton.addEventListener('click', () => closeDialog(false));
    remindLaterButton.addEventListener('click', () => closeDialog(true));

    // Close the dialog box when 'Esc' key is pressed
    document.addEventListener('keydown', escKeyListener);

    // Append elements
    dialog.appendChild(messageElement);
    dialog.appendChild(closeButton);
    dialog.appendChild(remindLaterButton);

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
    function closeDialog(remindLater) {
      dialog.remove();
      document.removeEventListener('keydown', escKeyListener);
      resolve(remindLater);
    }
  });
}
