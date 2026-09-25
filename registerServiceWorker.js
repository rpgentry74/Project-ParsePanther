// registerServiceWorker.js
import { recordDiagnostic } from './diagnostics.js';

const DEVELOPMENT_BUILD = '3.0.0-dev';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    recordDiagnostic('service-worker-unavailable', {
      code: 'NOT_SUPPORTED',
    });
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `./service-worker.js?v=${DEVELOPMENT_BUILD}`,
        { updateViaCache: 'none' }
      );

      await registration.update();

      recordDiagnostic('service-worker-registered', {
        status: registration.active?.state || 'registered',
      });

      console.log(
        `ParsePanther ${DEVELOPMENT_BUILD} service worker active with scope:`,
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
