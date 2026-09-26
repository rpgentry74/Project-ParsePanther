// registerServiceWorker.js
import { recordDiagnostic } from './diagnostics.js';
import { APP_VERSION, CACHE_NAME } from './appConfig.js';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    recordDiagnostic('service-worker-unavailable', {
      code: 'NOT_SUPPORTED',
    });
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const serviceWorkerUrl =
        `./service-worker.js?v=${encodeURIComponent(APP_VERSION)}&cache=${encodeURIComponent(CACHE_NAME)}`;

      const registration = await navigator.serviceWorker.register(
        serviceWorkerUrl,
        { updateViaCache: 'none' }
      );

      await registration.update();

      recordDiagnostic('service-worker-registered', {
        status: registration.active?.state || 'registered',
      });

      console.log(
        `Student Prerequisite Analyzer ${APP_VERSION} service worker active with scope:`,
        registration.scope
      );
    } catch (error) {
      recordDiagnostic('service-worker-registration-failed', {
        code: 'REGISTRATION_FAILED',
      });
      console.error('Service worker registration failed:', error);
    }
  });
}
