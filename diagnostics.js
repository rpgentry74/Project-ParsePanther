// diagnostics.js
const STORAGE_KEY = 'parsepanther-support-diagnostics-v1';
const MAX_EVENTS = 50;

const DEFAULT_STATE = {
  rosterAccepted: false,
  rosterVariant: null,
  directSelected: true,
  directAccepted: false,
  directVariant: null,
  indirectSelected: false,
  indirectAccepted: false,
  indirectVariant: null,
  outputGenerated: false,
};

const ALLOWED_STATE_KEYS = new Set(Object.keys(DEFAULT_STATE));
const ALLOWED_DETAIL_KEYS = new Set([
  'variant',
  'code',
  'status',
  'format',
  'source',
]);

let initialized = false;

function createEmptyDiagnostics() {
  return {
    state: { ...DEFAULT_STATE },
    events: [],
  };
}

function readDiagnostics() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));

    if (!stored || typeof stored !== 'object') {
      return createEmptyDiagnostics();
    }

    return {
      state: {
        ...DEFAULT_STATE,
        ...(stored.state && typeof stored.state === 'object'
          ? stored.state
          : {}),
      },
      events: Array.isArray(stored.events)
        ? stored.events.slice(-MAX_EVENTS)
        : [],
    };
  } catch {
    return createEmptyDiagnostics();
  }
}

function writeDiagnostics(data) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: data.state,
        events: data.events.slice(-MAX_EVENTS),
      })
    );
  } catch {
    // Diagnostics must never interfere with the application.
  }
}

function safeDetailValue(value) {
  if (
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 80) {
    return null;
  }

  return trimmed;
}

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') {
    return {};
  }

  const safe = {};

  for (const [key, value] of Object.entries(details)) {
    if (!ALLOWED_DETAIL_KEYS.has(key)) {
      continue;
    }

    const safeValue = safeDetailValue(value);

    if (safeValue !== null) {
      safe[key] = safeValue;
    }
  }

  return safe;
}

export function recordDiagnostic(type, details = {}) {
  const eventType = String(type || '').trim();

  if (!eventType || eventType.length > 80) {
    return;
  }

  const data = readDiagnostics();

  data.events.push({
    time: new Date().toISOString(),
    type: eventType,
    details: sanitizeDetails(details),
  });

  data.events = data.events.slice(-MAX_EVENTS);
  writeDiagnostics(data);
}

export function setDiagnosticState(partialState) {
  if (!partialState || typeof partialState !== 'object') {
    return;
  }

  const data = readDiagnostics();

  for (const [key, value] of Object.entries(partialState)) {
    if (!ALLOWED_STATE_KEYS.has(key)) {
      continue;
    }

    if (
      typeof DEFAULT_STATE[key] === 'boolean' &&
      typeof value === 'boolean'
    ) {
      data.state[key] = value;
      continue;
    }

    if (
      DEFAULT_STATE[key] === null &&
      (value === null || value === 'faculty' || value === 'admin')
    ) {
      data.state[key] = value;
    }
  }

  writeDiagnostics(data);
}

export function getDiagnostics() {
  const data = readDiagnostics();

  return {
    state: { ...data.state },
    events: data.events.map((event) => ({
      time: event.time,
      type: event.type,
      details: { ...event.details },
    })),
  };
}

export function clearDiagnostics() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function sourceFileName(filename) {
  try {
    const url = new URL(filename, window.location.href);
    return url.pathname.split('/').filter(Boolean).pop() || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function initializeDiagnostics() {
  if (initialized) {
    return;
  }

  initialized = true;
  recordDiagnostic('app-session-started');

  window.addEventListener('error', (event) => {
    recordDiagnostic('javascript-error', {
      code: 'WINDOW_ERROR',
      source: sourceFileName(event.filename),
    });
  });

  window.addEventListener('unhandledrejection', () => {
    recordDiagnostic('javascript-error', {
      code: 'UNHANDLED_REJECTION',
    });
  });
}
