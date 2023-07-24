// messageSystem.js

// Constants
// REMIND_ME_LATER_DAYS sets the number of days after which a "remind me later" message should reappear.
const REMIND_ME_LATER_DAYS = 7;

// ENABLE_NOTIFICATIONS enables or disables the notification system. Set this to false to disable notifications.
const ENABLE_NOTIFICATIONS = true;

// MESSAGE_HEADER sets the header for the notification messages. Adjust the header text here.
const MESSAGE_HEADER = '<strong>Important system updates:</strong>';

// This is the array of messages that can be displayed to the user.
// Each message is an object with an id and a text property. The id is used to uniquely identify each message.
// The text property contains the message that will be displayed to the user.
// You can add more messages to this array as needed.
const messages = [
  { id: '20230723.1', text: 'Downloading your table to a spreadsheet should now work, again! =)' },
  { id: '20230723.2', text: 'This is a test =)' },
];

// Custom dialog function for the message system
// This function creates a dialog box with the provided messages and buttons to close the dialog or set a reminder.
function showDialog(message, messageId) {
  return new Promise((resolve) => {
    // Remove any existing dialog
    const existingDialog = document.querySelector('.message-system-dialog');
    if (existingDialog) existingDialog.remove();

    // Create dialog elements
    const dialog = document.createElement('div');
    dialog.className = 'message-system-dialog dialog'; // Set class for styling
    dialog.setAttribute('role', 'dialog'); // Set role for accessibility

    // Create buttons with attached event listeners
    const dontShowAgainButton = document.createElement('button');
    dontShowAgainButton.textContent = 'Don\'t show again';
    dontShowAgainButton.className = 'dialog-button';
    dontShowAgainButton.addEventListener('click', () => {
      resolve('close');
      dialog.remove();
    });

    const remindMeLaterButton = document.createElement('button');
    remindMeLaterButton.textContent = 'Remind me later';
    remindMeLaterButton.className = 'dialog-button';
    remindMeLaterButton.addEventListener('click', () => {
      resolve('later');
      dialog.remove();
    });

    // Set dialog content
    dialog.innerHTML = `<p>${message}</p>`;
    dialog.appendChild(dontShowAgainButton);
    dialog.appendChild(remindMeLaterButton);

    // Append dialog to body
    document.body.appendChild(dialog);
  });
}

// This function retrieves the reminder status for a given message id.
// If a reminder exists and hasn't expired, or if the message text has changed since the reminder was set, it returns true.
// Otherwise, it returns false.
function getReminderStatus(messageId) {
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
  const reminder = reminders[messageId];
  if (!reminder || reminder.date <= Date.now() || reminder.version !== messages.find(msg => msg.id === messageId).text) {
    return true;
  }
  return false;
}

// This function sets the reminder status for a given message id.
// If the user has chosen to be reminded later, it sets the reminder to the current date + the number of days specified in REMIND_ME_LATER_DAYS.
// If the user has chosen not to see the message again, it sets the reminder to a far future date.
function setReminderStatus(messageId, messageText, remindLater) {
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
  const currentDate = new Date();
  const reminderDate = new Date(currentDate.setDate(currentDate.getDate() + (remindLater ? REMIND_ME_LATER_DAYS : 10000)));
  reminders[messageId] = { date: reminderDate.getTime(), version: messageText };
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

// This function displays new messages to the user.
// If notifications are enabled, it first filters out the messages that the user has chosen not to see again.
// It then checks each message to see if it needs to be shown, based on whether the user has seen it before and chosen to be reminded later, and whether the reminder has expired.
// If there are any new messages, it displays them in a dialog box.
// When the user closes the dialog box, it sets a reminder for each new message based on the user's choice.
export async function showNewMessages() {
  if (!ENABLE_NOTIFICATIONS) {
    return; // Return early if notifications are disabled
  }

  const newMessages = messages.filter(({ id }) => getReminderStatus(id));

  if (newMessages.length > 0) {
    const messageList = newMessages.map(({ text }) => `<li>${text}</li>`).join('');
    const newMessagesText = `${MESSAGE_HEADER}<ol>${messageList}</ol>`;
    const remindLater = await showDialog(newMessagesText, 'system-message');

    newMessages.forEach(({ id, text }) => {
      setReminderStatus(id, text, remindLater === 'later');
    });
  }
}
