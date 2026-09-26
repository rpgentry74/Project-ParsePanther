// messageSystem.js
import { showChoiceDialog } from './dialogHandler.js';
import { APP_VERSION, IS_DEVELOPMENT } from './appConfig.js';

const REMIND_ME_LATER_DAYS = 7;
const ENABLE_NOTIFICATIONS = true;
const MESSAGE_HEADER = IS_DEVELOPMENT
  ? '<strong>Version 3 development status:</strong>'
  : '<strong>Version 3:</strong>';

const messages = [
  {
    id: `version-${APP_VERSION}`,
    text: IS_DEVELOPMENT
      ? 'This is the Version 3 development build of the LRCCD Student Prerequisite Analyzer. The redesigned results make it easier to see who has completed the prerequisites, who is missing prerequisites, and how Indirect Evidence affects a student\'s status. Student details, editable Copy Message tools, and Support Diagnostics are also included. Final release testing is underway. If a result looks unexpected, use Support Diagnostics when contacting support before relying on the output.'
      : 'Version 3 of the LRCCD Student Prerequisite Analyzer is now available. Results now make it easier to see who has completed the prerequisites, who is missing prerequisites, and how Indirect Evidence affects a student\'s status. Student details, editable Copy Message tools, and Support Diagnostics are also included.',
  },
];

function readReminders() {
  try {
    const parsed = JSON.parse(localStorage.getItem('reminders')) || {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeReminders(reminders) {
  try {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  } catch {
    // Notifications should never block the application.
  }
}

(function purgeLegacyReminders() {
  const reminders = readReminders();
  const valid = new Set(messages.map((message) => message.id));
  let changed = false;

  for (const key of Object.keys(reminders)) {
    if (!valid.has(key)) {
      delete reminders[key];
      changed = true;
    }
  }

  if (changed) {
    writeReminders(reminders);
  }
})();

function getReminderStatus(messageId) {
  const reminders = readReminders();
  const reminder = reminders[messageId];
  const current = messages.find((message) => message.id === messageId);

  if (!current) {
    return false;
  }

  if (!reminder) {
    return true;
  }

  if (reminder.date <= Date.now()) {
    return true;
  }

  if (reminder.version !== current.text) {
    return true;
  }

  return false;
}

function setReminderStatus(messageId, messageText, remindLater) {
  const reminders = readReminders();
  const now = new Date();
  const reminderDate = new Date(
    now.setDate(
      now.getDate() + (remindLater ? REMIND_ME_LATER_DAYS : 10000)
    )
  );

  reminders[messageId] = {
    date: reminderDate.getTime(),
    version: messageText,
  };

  writeReminders(reminders);
}

export async function showNewMessages() {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }

  const newMessages = messages.filter(({ id }) =>
    getReminderStatus(id)
  );

  if (newMessages.length === 0) {
    return;
  }

  const messageList = newMessages
    .map(({ text }) => `<li>${text}</li>`)
    .join('');
  const messageText = `${MESSAGE_HEADER}<ol>${messageList}</ol>`;

  const response = await showChoiceDialog(
    messageText,
    [
      {
        label: 'Don\'t show again',
        value: 'close',
        className: 'dialog-button',
      },
      {
        label: 'Remind me later',
        value: 'later',
        className: 'dialog-button',
      },
    ],
    {
      ariaLabel: 'Student Prerequisite Analyzer update',
      escapeValue: 'later',
    }
  );

  newMessages.forEach(({ id, text }) => {
    setReminderStatus(id, text, response === 'later');
  });
}
