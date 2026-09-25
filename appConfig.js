// appConfig.js

export const APP_VERSION = '3.0.0-dev';
export const BUILD_NUMBER = '25';
export const CACHE_NAME = `parsepanther-v3-dev-${BUILD_NUMBER}`;
export const IS_DEVELOPMENT = APP_VERSION.endsWith('-dev');

export const DISPLAY_VERSION = IS_DEVELOPMENT
  ? 'v3.0 Development'
  : `v${APP_VERSION}`;

export function applyBuildMetadata() {
  const badge = document.getElementById('buildBadge');

  if (badge) {
    badge.textContent = DISPLAY_VERSION;
  }

  document.documentElement.dataset.appVersion = APP_VERSION;
}
