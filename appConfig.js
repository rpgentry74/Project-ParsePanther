// appConfig.js

export const APP_VERSION = '3.0.0-dev';
export const BUILD_NUMBER = '31';
export const IS_DEVELOPMENT = APP_VERSION.endsWith('-dev');

const MAJOR_VERSION = APP_VERSION.split('.')[0];
const CACHE_CHANNEL = IS_DEVELOPMENT
  ? `v${MAJOR_VERSION}-dev`
  : `v${MAJOR_VERSION}`;

export const CACHE_NAME =
  `parsepanther-${CACHE_CHANNEL}-${BUILD_NUMBER}`;

export const DISPLAY_VERSION = IS_DEVELOPMENT
  ? `v${APP_VERSION.replace(/-dev$/, '')} Development`
  : `v${APP_VERSION}`;

export function applyBuildMetadata() {
  const badge = document.getElementById('buildBadge');

  if (badge) {
    badge.textContent = DISPLAY_VERSION;
  }

  document.documentElement.dataset.appVersion = APP_VERSION;
}
