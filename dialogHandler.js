// dialogHandler.js

let closeActiveDialog = null;
let dialogSequence = 0;

export function showChoiceDialog(
  message,
  choices,
  {
    ariaLabel = 'Student Prerequisite Analyzer message',
    escapeValue = null,
  } = {}
) {
  if (closeActiveDialog) {
    closeActiveDialog();
  }

  return new Promise((resolve) => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = document.createElement('div');
    const messageElement = document.createElement('p');
    const dialogId = `student-prerequisite-dialog-${++dialogSequence}`;
    const messageId = `${dialogId}-message`;

    dialog.className = 'dialog';
    dialog.id = dialogId;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', ariaLabel);
    dialog.setAttribute('aria-describedby', messageId);

    messageElement.className = 'dialog-message';
    messageElement.id = messageId;

    // Dialog markup is application controlled. Any LRCCD-derived values must
    // be escaped by the caller before interpolation.
    messageElement.innerHTML = message;
    dialog.appendChild(messageElement);

    const buttons = choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice.label;
      button.className = choice.className || 'dialog-button';
      dialog.appendChild(button);
      return { button, value: choice.value };
    });

    document.body.appendChild(dialog);

    function closeDialog(value = escapeValue) {
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

      resolve(value);
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(escapeValue);
        return;
      }

      if (event.key !== 'Tab' || buttons.length === 0) {
        return;
      }

      const first = buttons[0].button;
      const last = buttons[buttons.length - 1].button;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    for (const { button, value } of buttons) {
      button.addEventListener('click', () => closeDialog(value));
    }

    closeActiveDialog = closeDialog;
    document.addEventListener('keydown', handleKeydown);
    buttons[0]?.button.focus();
  });
}

export function showDialog(
  message,
  withConfirmation = false,
  {
    closeLabel = 'Close',
    confirmLabel = 'Confirm',
  } = {}
) {
  const choices = [
    {
      label: closeLabel,
      value: false,
      className: 'dialog-button',
    },
  ];

  if (withConfirmation) {
    choices.push({
      label: confirmLabel,
      value: true,
      className: 'dialog-button confirm',
    });
  }

  return showChoiceDialog(message, choices, {
    escapeValue: false,
  });
}
