# LRCCD Student Prerequisite Analyzer

ParsePanther is a client-side web application for Los Rios Community College District faculty and staff. It organizes copied Class Roster, Direct Prerequisite Checker, and Indirect Prerequisite Checker data into a single prerequisite-completion table and downloadable spreadsheet.

## Development status

The `v3-refactor` branch is the development build for version 3.0.0. Production remains on `main` until the v3 regression and end-to-end checks are complete.

## Privacy

All roster and prerequisite processing occurs in the browser. ParsePanther does not transmit pasted student data to a server.

## Supported LRCCD input formats

Version 3 detects and parses the current Faculty and Admin variants independently:

- Class Roster
  - Faculty
  - Admin
- Direct Prerequisite Checker
  - Faculty
  - Admin
- Indirect Prerequisite Checker
  - Faculty
  - Admin

Faculty and Admin are treated as separate source formats that normalize to the same application data contracts. This separation is deliberate: a source-format change can be repaired and regression-tested inside the affected Faculty or Admin parser without changing the other parser. The parsers recognize both legacy course numbers and Common Course Numbering values such as `STAT C1000`. They fail closed when an unsupported course block is detected rather than silently attaching student rows to the previous course. A recognized Direct page with no listed prerequisite courses uses an explicit user confirmation instead of being treated as a parser failure.

Direct data defines the official prerequisites that are evaluated. Official former-course numbers are treated as identities of those prerequisites, including when the former-course relationship is documented on an Indirect page. Indirect completions under an official course or official former number can therefore satisfy that prerequisite. Courses that appear only in the Indirect Prerequisite Checker remain informational evidence and do not affect prerequisite status.

If Indirect Evidence is selected but no Indirect Prerequisite Checker data was pasted, a user who already has valid Direct prerequisite data may explicitly continue without Indirect Evidence. This exception applies only to an empty Indirect field. Pasted Indirect data that fails parsing remains fail-closed and must be reviewed.

## Parser architecture

Each data type has a dispatcher that identifies the LRCCD source variant and sends the text to a dedicated parser. Tabs and line boundaries are preserved when they carry structure.

Key parser files include:

- `rosterParser.js`
- `parseFacultyRoster.js`
- `parseAdminRoster.js`
- `directPrerequisiteParser.js`
- `parseFacultyDirectPrerequisites.js`
- `parseAdminDirectPrerequisites.js`
- `indirectPrerequisiteParser.js`
- `parseFacultyIndirectPrerequisites.js`
- `parseAdminIndirectPrerequisites.js`

## Shared application model

After parsing, shared application behavior is intentionally centralized:

- `prerequisiteDataUtils.js` reconciles official prerequisites, former-course identities, and Indirect Evidence.
- `resultsModel.js` creates the single per-student result model used by the results table, filters, student detail, Copy Message decisions, and spreadsheet exports.
- `studentMessage.js` generates the editable Copy Message from missing prerequisites only.
- `workflowRules.js` contains the submission-state decisions used by the Process Data workflow.
- `appConfig.js` holds the runtime application version, build number, cache name, and display version.

Faculty/Admin parser modules remain separate even where small helper patterns are duplicated. That isolation is intentional and limits the effect of future LRCCD format changes.

## Regression tests

Sanitized regression fixtures are stored under `tests/`. They preserve LRCCD clipboard structure without committing real student information.

Open `tests/index.html` through the same web server used for the application to run all parser suites together.

Regression coverage includes:

- Faculty/Admin source detection
- LEC and LAB extraction
- leading-zero student IDs
- Admin waitlist and no-waitlist roster variants
- dropped-student exclusion
- legacy and Common Course Numbering headings such as `STAT 300` and `STAT C1000`
- multiple former-course aliases
- Direct-to-Indirect alias reconciliation without duplicate old/new prerequisite columns
- official prerequisite evaluation separated from informational Indirect-only evidence
- former-course relationships documented on Indirect pages can update the matching official prerequisite
- legitimate empty prerequisite sections
- fail-closed behavior for unsupported course blocks and unrecognized structures
- shared result status, missing-prerequisite, and Indirect Evidence calculations
- Copy Message generation
- empty-Indirect and other submission workflow decisions
- diagnostics privacy allowlisting
- wide-table overflow and horizontal-scroll state

When LRCCD changes a page format, add a sanitized example as a regression case before or alongside the parser fix.

## Interface

Version 3 refreshes the visual design while keeping the application a practical faculty/staff utility. The top-level interface is organized around Home, Support, and About. Home keeps the working analyzer front and center, with an expanded Overview and collapsed Step-by-Step Instructions above the course-data workflow. Support and About use the same collapsible information-panel pattern for reference material without crowding the working interface.

The results view now includes a compact class summary and filters for complete students, students missing prerequisites, and students with Indirect Evidence. Each student has a detail view that shows prerequisite status, whether completion is listed in the Prerequisite Checker or supported by Indirect Prerequisite Checker evidence, and any additional indirect-only evidence. Students missing prerequisites also have an editable Copy Message tool that lists only the missing prerequisites.

Wide results tables expand naturally instead of compressing prerequisite columns. The table scrolls horizontally inside the results card, keeps Student ID and Student Name visible, exposes keyboard-focusable table navigation, and shows explicit left/right scroll controls only when horizontal overflow exists.

## Support Diagnostics

Version 3 includes a privacy-safe `support.html` diagnostics page for remote troubleshooting. It reports browser, viewport, PWA/service-worker, cache, application-state, and recent workflow-event information stored only for the current browser session. The diagnostics system deliberately excludes pasted LRCCD text, student names, student IDs, course and professor information, prerequisite records, and result-table contents.

Questions, suggestions, and problem reports are handled through email rather than a separate feedback form. When a problem cannot be reproduced locally, the user can copy or download the Support Diagnostics report and include it with the email.

## Downloads

Processed results can be exported as:

- XLSX
- CSV
- ODS

Exports include the official prerequisite status shown in the browser results.

SheetJS and FileSaver.js are included in the repository and run in the browser.

## Progressive Web App

ParsePanther includes a service worker and web app manifest for offline support. The v3 development build uses a network-first cache strategy and development-specific cache names so stale production assets do not mask refactor changes.

Runtime version and cache metadata are defined in `appConfig.js`. The service worker receives the configured cache name through its registration URL, avoiding a second hard-coded build value inside `service-worker.js`.

## Release maintenance

Use `RELEASE_CHECKLIST.md` for the Version 3 regression, browser, privacy, PWA, and production checks.

## Contributing

Because the parser is tightly coupled to LRCCD source pages and handles sensitive student information in normal use, changes should be tested against sanitized LRCCD structures before release. Do not commit real student names, IDs, or roster data.

## License

ParsePanther is licensed under the MIT License. See `LICENSE.txt`.
