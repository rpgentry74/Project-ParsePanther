// dialogHandler.js

let closeActiveDialog = null;
let dialogSequence = 0;

export function showDialog(
  message,
  withConfirmation = false,
  {
    closeLabel = 'Close',
    confirmLabel = 'Confirm',
  } = {}
) {
  if (closeActiveDialog) {
    closeActiveDialog(false);
  }

  return new Promise((resolve) => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = document.createElement('div');
    const messageElement = document.createElement('p');
    const closeButton = document.createElement('button');
    let confirmButton = null;

    const dialogId = `parsepanther-dialog-${++dialogSequence}`;
    const messageId = `${dialogId}-message`;

    dialog.className = 'dialog';
    dialog.id = dialogId;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Student Prerequisite Analyzer message');
    dialog.setAttribute('aria-describedby', messageId);

    messageElement.className = 'dialog-message';
    messageElement.id = messageId;

    // Dialog markup is created by ParsePanther. Any values derived from
    // pasted LRCCD data must be escaped by the caller before interpolation.
    messageElement.innerHTML = message;

    closeButton.type = 'button';
    closeButton.textContent = closeLabel;
    closeButton.className = 'dialog-button';

    if (withConfirmation) {
      confirmButton = document.createElement('button');
      confirmButton.type = 'button';
      confirmButton.textContent = confirmLabel;
      confirmButton.className = 'dialog-button confirm';
    }

    dialog.appendChild(messageElement);
    dialog.appendChild(closeButton);

    if (confirmButton) {
      dialog.appendChild(confirmButton);
    }

    document.body.appendChild(dialog);

    const focusableButtons = [closeButton, confirmButton].filter(Boolean);

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(false);
        return;
      }

      if (event.key !== 'Tab' || focusableButtons.length === 0) {
        return;
      }

      const first = focusableButtons[0];
      const last = focusableButtons[focusableButtons.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function closeDialog(confirmed) {
      if (!dialog.isConnected) {
        return;
      }

      dialog.remove();
      document.removeEventListener('keydown', handleKeydown);

      if (closeActiveDialog === closeDialog) {
        closeActiveDialog = null;
      }

      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }

      resolve(confirmed);
    }

    closeActiveDialog = closeDialog;

    closeButton.addEventListener('click', () => closeDialog(false));

    if (confirmButton) {
      confirmButton.addEventListener('click', () => closeDialog(true));
    }

    document.addEventListener('keydown', handleKeydown);
    closeButton.focus();
  });
}
