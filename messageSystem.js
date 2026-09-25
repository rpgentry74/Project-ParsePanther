// messageSystem.js

// Constants
const REMIND_ME_LATER_DAYS = 7;
const ENABLE_NOTIFICATIONS = true;
const MESSAGE_HEADER = '<strong>System status:</strong>';

// Current messages (old ones removed)
const messages = [
  {
    id: '20260119.1',
    text:
      'Prerequisite Checker update: LRCCD changed the formatting of prerequisite pages in January 2026. Direct prerequisite parsing has been updated to restore correct section headers for both faculty and admin views. If results look incorrect, please refresh the page and re-paste the data.'
  }
];

// One-time cleanup: drop reminders for messages that no longer exist
(function purgeLegacyReminders() {
  try {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
    const valid = new Set(messages.map(m => m.id));
    let changed = false;
    for (const key of Object.keys(reminders)) {
      if (!valid.has(key)) {
        delete reminders[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem('reminders', JSON.stringify(reminders));
  } catch {
    // ignore JSON or storage errors
  }
})();

// Dialog
function showDialog(message, messageId) {
  return new Promise((resolve) => {
    const existingDialog = document.querySelector('.message-system-dialog');
    if (existingDialog) existingDialog.remove();

    const dialog = document.createElement('div');
    dialog.className = 'message-system-dialog dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

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

    dialog.innerHTML = `<p>${message}</p>`;
    dialog.appendChild(dontShowAgainButton);
    dialog.appendChild(remindMeLaterButton);

    // basic ESC close for UX
    const onKey = (e) => {
      if (e.key === 'Escape') {
        resolve('close');
        dialog.remove();
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(dialog);
    dontShowAgainButton.focus();
  });
}

// Reminder helpers
function getReminderStatus(messageId) {
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
  const reminder = reminders[messageId];
  const current = messages.find(msg => msg.id === messageId);
  if (!current) return false; // unknown id, skip
  if (!reminder) return true; // never seen
  if (reminder.date <= Date.now()) return true; // expired
  if (reminder.version !== current.text) return true; // text changed
  return false; // still suppressed
}

function setReminderStatus(messageId, messageText, remindLater) {
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
  const now = new Date();
  const reminderDate = new Date(
    now.setDate(
      now.getDate() + (remindLater ? REMIND_ME_LATER_DAYS : 10000)
    )
  );
  reminders[messageId] = { date: reminderDate.getTime(), version: messageText };
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Public API
export async function showNewMessages() {
  if (!ENABLE_NOTIFICATIONS) return;

  const newMessages = messages.filter(({ id }) => getReminderStatus(id));
  if (newMessages.length === 0) return;

  const messageList = newMessages.map(({ text }) => `<li>${text}</li>`).join('');
  const newMessagesText = `${MESSAGE_HEADER}<ol>${messageList}</ol>`;
  const remindLater = await showDialog(newMessagesText, 'system-message');

  newMessages.forEach(({ id, text }) => {
    setReminderStatus(id, text, remindLater === 'later');
  });
}
