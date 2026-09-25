// registerServiceWorker.js

const DEVELOPMENT_BUILD = '3.0.0-dev';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `./service-worker.js?v=${DEVELOPMENT_BUILD}`,
        { updateViaCache: 'none' }
      );

      await registration.update();

      console.log(
        `ParsePanther ${DEVELOPMENT_BUILD} service worker active with scope:`,
        registration.scope
      );
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
}
