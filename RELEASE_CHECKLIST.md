# Version 3 Release Checklist

Version 3 keeps LRCCD source parsing modular while centralizing shared application behavior after parsing.

## 1. Set the release build

Edit only `appConfig.js` for the runtime release identifiers:

- Set `APP_VERSION` to the release version.
- Increment `BUILD_NUMBER` whenever cached application assets change before release.
- Confirm the derived `CACHE_NAME` is unique for the release build.

The application header, support report, startup message mode, service-worker registration URL, and service-worker cache all use this shared configuration.

## 2. Run the regression dashboard

Open `tests/index.html` through the same web server used for the application.

All suites must report PASSED:

- Faculty/Admin roster parsing
- Faculty/Admin Prerequisite Checker parsing
- Faculty/Admin Indirect Prerequisite Checker parsing
- prerequisite merge and former-course reconciliation
- shared results model
- Copy Message generation
- submission workflow rules
- diagnostics privacy allowlist
- wide-table overflow and horizontal-scroll state

If an LRCCD format changed, add a sanitized regression case before or alongside the parser change.

## 3. Run end-to-end browser checks

Test current Faculty and Admin source pages separately.

For each supported source path, verify:

- roster paste and confirmation
- Prerequisite Checker paste and confirmation
- Indirect Evidence when applicable
- confirmed no-prerequisite workflow when applicable
- empty Indirect Evidence continuation
- fail-closed behavior for malformed or unexpected pasted data
- class summary and filters
- wide-table behavior with enough prerequisite/Indirect Evidence columns to overflow the results card
- sticky Student ID and Student Name columns while horizontally scrolling
- left/right wide-table controls and keyboard focus on the table region
- student detail and evidence explanation
- editable Copy Message
- XLSX, CSV, and ODS downloads
- reset behavior
- Home is the default active section and Home, Support, and About always leave one top-level section active
- Overview is expanded by default and Step-by-Step Instructions is collapsed by default
- Support and About collapsible sections use the intended default open/collapsed states
- keyboard navigation and dialogs

## 4. Check Support Diagnostics

Open `support.html` after using the application.

Verify that the report includes:

- application version and expected cache
- browser and viewport information
- service-worker/cache state
- accepted-state booleans and Faculty/Admin source variants
- recent safe workflow events

Verify that it does not include:

- pasted LRCCD text
- student names
- student IDs
- course or professor information
- prerequisite records
- result-table contents

## 5. Verify PWA update behavior

- Reload with the network available.
- Confirm the expected cache name appears in Support Diagnostics.
- Confirm older ParsePanther-prefixed caches are removed after activation.
- Confirm the application still loads from cache when the network is unavailable.

## 6. Production review

Before merging to `main`:

- review the Version 3 notes in `index.html`
- confirm the startup message is appropriate for the release build
- confirm `manifest.json` remains release-neutral
- compare `v3-refactor` with `main`
- confirm no real student information is present in committed fixtures or code
- merge only after the regression and end-to-end checks are complete
