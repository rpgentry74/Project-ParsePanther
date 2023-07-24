// messageSystem.js

import { showDialog } from './dialogHandler.js';

// Constants
const REMIND_ME_LATER_DAYS = 7;
const ENABLE_NOTIFICATIONS = true;  // Set this to false to disable notifications

// Array of messages
// Example format { id: 'message1', text: 'Download doesn\'t work.' },
const messages = [
  { id: 'message1', text: 'Downloading to a spreadsheet temporially doesn\'t work.'},
  // More messages can be added here...
];

function getReminderStatus(messageId) {
  // Get the stored reminders
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};

  // Get the reminder for this message
  const reminder = reminders[messageId];

  // If there's no reminder, show the message
  if (!reminder) return true;

  // If the reminder has expired, show the message
  const currentDate = new Date();
  const reminderDate = new Date(reminder.date);
  if (currentDate >= reminderDate) return true;

  // If the message has been updated since the reminder was set, show the message
  if (reminder.version !== messages.find(message => message.id === messageId).text) return true;

  // Otherwise, don't show the message
  return false;
}

function setReminderStatus(messageId, messageText, days) {
  // Get the current reminders
  const reminders = JSON.parse(localStorage.getItem('reminders')) || {};

  // Update the reminder for this message
  const currentDate = new Date();
  const reminderDate = new Date(currentDate.setDate(currentDate.getDate() + days));
  reminders[messageId] = { date: reminderDate, version: messageText };

  // Store the reminders
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

export async function showNewMessages() {
    if (!ENABLE_NOTIFICATIONS) {
      return; // Return early if notifications are disabled
    }
  
    let newMessages = messages.filter(({ id }) => getReminderStatus(id));
  
    if (newMessages.length > 0) {
      const defaultMessageHeader = "<strong>Please be aware of the following:</strong>";
      const newMessagesText = defaultMessageHeader + '<br/>' + newMessages.map(({ text }) => text).join('<br/>');
      const remindLater = await showDialog(newMessagesText);
    
      newMessages.forEach(({ id, text }) => {
        setReminderStatus(id, text, remindLater ? REMIND_ME_LATER_DAYS : 0);
      });
    }
  }
