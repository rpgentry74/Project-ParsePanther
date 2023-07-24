# LRCCD Student Prerequisite Analyzer

## Overview

The Los Rios Community College District (LRCCD) Student Prerequisite Analyzer is a web-based application designed to automate and streamline the process of verifying and tracking course prerequisites for students. It is built with JavaScript, HTML, and CSS, and designed to run completely client-side in the user's web browser.

The application works by parsing roster and prerequisite data pasted in by the user, and generates a neatly organized and color-coded table that represents the prerequisite fulfillment status of each student. In addition, the application also provides an option to download this data in various formats including Excel, CSV, and ODS, enabling further analysis or archiving.

The LRCCD Student Prerequisite Analyzer is designed with a focus on privacy - no data is transmitted to any server, and all processing is done directly in the user's browser. The application also incorporates a progressive web app (PWA) architecture, which allows it to be used offline and provides a smooth, app-like experience on mobile devices.

## Installation

The LRCCD Student Prerequisite Analyzer is a client-side application and does not require a traditional installation process. You can use the app directly from the hosted location, or download the source code to run it locally or host it on your own server. The source code is self-contained and includes all necessary dependencies.

### Dependencies

This application relies on two key JavaScript libraries:

1. [xlsx.js](https://github.com/SheetJS/sheetjs) - a comprehensive, parser and writer library for various spreadsheet formats. It's used to generate and download the student data in different formats (Excel, CSV, ODS). 

2. [FileSaver.js](https://github.com/eligrey/FileSaver.js/) - an HTML5 `saveAs()` FileSaver implementation. It allows users to save files on the client-side, which is necessary for downloading the spreadsheet files created by xlsx.js.

These libraries are included in the source code, and no additional installation or configuration is required.

### Credit

This project wouldn't have been possible without the amazing work done by the developers of xlsx.js and FileSaver.js. We also extend our gratitude to the entire open source community for their invaluable contributions to software development.

## Usage

1. Open the `index.html` file in your web browser. 
2. Follow the instructions on the application for checking student prerequisites. 
3. The application should work on all modern web browsers and doesn't require any special permissions or additional software.

Remember that all data processing occurs within the browser, and no data is transmitted or stored elsewhere, ensuring the privacy of your data.

## Contributing

Due to the sensitive nature of the data parsing in the LRCCD Student Prerequisite Analyzer, any changes to this repository must be linked to the colleges of the Los Rios Community College District to ensure no disruption in functionality. 

While we are cautious about changes, we appreciate your interest and welcome your feedback. If you have a feature request, bug report, or proposal for improving the app, feel free to open an issue on the GitHub repository.

If you're interested in contributing directly to the code, please contact the maintainers directly to discuss the potential changes. As this project is tied closely with the colleges of the Los Rios Community College District, we want to ensure that all changes maintain the integrity and functionality of the application.

## License

The LRCCD Student Prerequisite Analyzer is licensed under the [MIT License](https://opensource.org/licenses/MIT). This means you can use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, under the condition that you include the original copyright notice and disclaim the warranty. For more details, see the `LICENSE` file in the project repository.



