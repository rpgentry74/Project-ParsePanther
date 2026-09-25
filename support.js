// support.js
import {
  clearDiagnostics,
  getDiagnostics,
} from './diagnostics.js';

const APP_VERSION = '3.0.0-dev';

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function valueOrUnknown(value) {
  return value || 'Unknown';
}

function localTime() {
  try {
    return new Date().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'long',
    });
  } catch {
    return new Date().toString();
  }
}

function displayMode() {
  if (window.matchMedia?.('(display-mode: standalone)').matches) {
    return 'standalone';
  }

  if (window.navigator.standalone === true) {
    return 'standalone';
  }

  return 'browser';
}

async function serviceWorkerReport() {
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      activeState: 'Not supported',
      controller: false,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    return {
      supported: true,
      registered: Boolean(registration),
      activeState:
        registration?.active?.state ||
        registration?.installing?.state ||
        registration?.waiting?.state ||
        'No active worker',
      controller: Boolean(navigator.serviceWorker.controller),
    };
  } catch {
    return {
      supported: true,
      registered: false,
      activeState: 'Unable to inspect',
      controller: Boolean(navigator.serviceWorker.controller),
    };
  }
}

async function cacheReport() {
  if (!('caches' in window)) {
    return ['Cache API unavailable'];
  }

  try {
    const names = await caches.keys();
    const parsePantherCaches = names
      .filter((name) => name.startsWith('parsepanther-'))
      .sort();

    return parsePantherCaches.length
      ? parsePantherCaches
      : ['No application cache detected'];
  } catch {
    return ['Unable to inspect cache'];
  }
}

function formatDetails(details = {}) {
  const entries = Object.entries(details);

  if (!entries.length) {
    return '';
  }

  return ' | ' + entries
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

function formatEvents(events) {
  if (!events.length) {
    return ['No diagnostic events recorded in this browser session.'];
  }

  return events.map((event) => {
    let time = event.time;

    try {
      time = new Date(event.time).toLocaleTimeString();
    } catch {
      // Keep the stored ISO value.
    }

    return `${time} | ${event.type}${formatDetails(event.details)}`;
  });
}

async function buildReport() {
  const diagnostics = getDiagnostics();
  const sw = await serviceWorkerReport();
  const cacheNames = await cacheReport();
  const platform =
    navigator.userAgentData?.platform ||
    navigator.platform ||
    'Unknown';

  const state = diagnostics.state;

  return [
    'LRCCD Student Prerequisite Analyzer Support Report',
    '',
    `App version: ${APP_VERSION}`,
    `Date/time: ${localTime()}`,
    '',
    'Browser',
    `User agent: ${valueOrUnknown(navigator.userAgent)}`,
    `Platform: ${valueOrUnknown(platform)}`,
    `Language: ${valueOrUnknown(navigator.language)}`,
    `Online: ${yesNo(navigator.onLine)}`,
    `Viewport: ${window.innerWidth} x ${window.innerHeight}`,
    `Device pixel ratio: ${window.devicePixelRatio || 1}`,
    `Display mode: ${displayMode()}`,
    '',
    'PWA / Cache',
    `Service worker supported: ${yesNo(sw.supported)}`,
    `Service worker registered: ${yesNo(sw.registered)}`,
    `Service worker state: ${sw.activeState}`,
    `Controller present: ${yesNo(sw.controller)}`,
    `Detected caches: ${cacheNames.join(', ')}`,
    '',
    'Application State',
    `Roster accepted: ${yesNo(state.rosterAccepted)}`,
    `Roster source: ${state.rosterVariant || 'None'}`,
    `Prerequisites selected: ${yesNo(state.directSelected)}`,
    `Prerequisite data accepted: ${yesNo(state.directAccepted)}`,
    `Prerequisite source: ${state.directVariant || 'None'}`,
    `Indirect Evidence selected: ${yesNo(state.indirectSelected)}`,
    `Indirect data accepted: ${yesNo(state.indirectAccepted)}`,
    `Indirect source: ${state.indirectVariant || 'None'}`,
    `Results generated: ${yesNo(state.outputGenerated)}`,
    '',
    'Recent Application Events',
    ...formatEvents(diagnostics.events),
    '',
    'Privacy',
    'This report intentionally excludes pasted LRCCD data, student names, student IDs, course/professor information, prerequisite records, and result table contents.',
  ].join('\n');
}

async function refreshReport() {
  const report = document.getElementById('supportReport');
  report.textContent = await buildReport();
}

async function copyReport() {
  const report = document.getElementById('supportReport').textContent;
  const status = document.getElementById('supportActionStatus');

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(report);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = report;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }

    status.textContent = 'Support report copied.';
  } catch {
    status.textContent =
      'Unable to copy automatically. Select the report text and copy it manually.';
  }
}

function downloadReport() {
  const report = document.getElementById('supportReport').textContent;
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'student-prerequisite-analyzer-support-report.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  document.getElementById('supportActionStatus').textContent =
    'Support report downloaded.';
}

async function clearReportDiagnostics() {
  clearDiagnostics();
  await refreshReport();
  document.getElementById('supportActionStatus').textContent =
    'Session diagnostics cleared.';
}

document
  .getElementById('copySupportReport')
  .addEventListener('click', copyReport);

document
  .getElementById('downloadSupportReport')
  .addEventListener('click', downloadReport);

document
  .getElementById('refreshSupportReport')
  .addEventListener('click', refreshReport);

document
  .getElementById('clearSupportDiagnostics')
  .addEventListener('click', clearReportDiagnostics);

refreshReport();
