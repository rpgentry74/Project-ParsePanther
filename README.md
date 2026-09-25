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

Faculty and Admin are treated as separate source formats that normalize to the same application data contracts. The parsers recognize both legacy course numbers and Common Course Numbering values such as `STAT C1000`. They fail closed when an unsupported course block is detected rather than silently attaching student rows to the previous course. A recognized Direct page with no listed prerequisite courses uses an explicit user confirmation instead of being treated as a parser failure.

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

When LRCCD changes a page format, add a sanitized example as a regression case before or alongside the parser fix.

## Interface

Version 3 refreshes the visual design while keeping the application a practical faculty/staff utility. The interface uses the existing LRCCD-inspired navy, blue, and gold palette, a wider card-based workflow, compact processing-status badges, collapsible information tabs, and a clearer results table. Official prerequisites, indirect evidence, and per-student status are visually separated so the table remains easy to scan.

## Downloads

Processed results can be exported as:

- XLSX
- CSV
- ODS

SheetJS and FileSaver.js are included in the repository and run in the browser.

## Progressive Web App

ParsePanther includes a service worker and web app manifest for offline support. The v3 development build uses a network-first cache strategy and development-specific cache names so stale production assets do not mask refactor changes.

## Contributing

Because the parser is tightly coupled to LRCCD source pages and handles sensitive student information in normal use, changes should be tested against sanitized LRCCD structures before release. Do not commit real student names, IDs, or roster data.

## License

ParsePanther is licensed under the MIT License. See `LICENSE.txt`.
