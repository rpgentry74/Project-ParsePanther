// Import necessary modules
import { getState } from './state.js';
import { colorCodeCells } from './colorCodeCells.js';

// Define the generateHTMLTable function
export async function generateHTMLTable() {
  // Retrieve data from the state
  let { rosterData, classData, indirectClassData } = getState();

  // Ensure classData is resolved
  if (classData instanceof Promise) {
    classData = await classData;
  }

  // Ensure indirectClassData is resolved
  if (indirectClassData instanceof Promise) {
    indirectClassData = await indirectClassData;
  }

  // Ensure there is valid data to work with
  if (!rosterData || (!classData && !indirectClassData)) {
    return "<p>Error: Invalid roster data or class data.</p>";
  }

  // Extract necessary data from the state
  const professorName = rosterData.professor || 'Unknown';
  const courseName = rosterData.course || 'Unknown';
  const lecNum = rosterData.lecNum || 'None';
  const labNum = rosterData.labNum || 'None';

  // Merge classData.prerequisiteCourses and indirectClassData.prerequisiteCourses if they exist
  const directPrerequisites = (classData && classData.prerequisiteCourses) ? classData.prerequisiteCourses : {};
  const indirectPrerequisites = (indirectClassData && indirectClassData.prerequisiteCourses) ? indirectClassData.prerequisiteCourses : {};
  const allPrerequisites = { ...directPrerequisites, ...indirectPrerequisites };

  // Generate a list of unique prerequisites
  const uniquePrerequisites = [...new Set(Object.keys(allPrerequisites))];

  // Generate table headers for each unique prerequisite
  const prerequisiteHeadersHTML = uniquePrerequisites
    .map((prerequisite) => `<th>${prerequisite}</th>`)
    .join('');

  // Generate rows for student roster and course completion
  const rowsHTML = rosterData.studentRoster
    .map((student) => {
      const courseCompletionHTML = uniquePrerequisites
        .map((prerequisite) => {
          const hasTakenCourse = (directPrerequisites[prerequisite] || indirectPrerequisites[prerequisite]).includes(student.studentID);
          const checkmarkHTML = hasTakenCourse ? `<span class="checkmark">&#x2713;</span>` : '';
          return `<td class="${hasTakenCourse ? 'taken' : 'not-taken'}">${checkmarkHTML}</td>`;
        })
        .join('');

      return `
        <tr>
          <td class="center student-info">${student.studentID}</td>
          <td class="left student-info">${student.studentName}</td>
          ${courseCompletionHTML}
        </tr>
      `;
    })
    .join('');

  // Assign an id attribute to the table element
  const tableId = 'mergedTable';
  const tableElementHTML = `
    <table class="merged-table" id="${tableId}">
      <thead>
        <tr>
            <th colspan="2">Student Info</th>
            <th colspan="${uniquePrerequisites.length}">Prerequisites</th>
        </tr>
        <tr>
            <th class="center">Student ID</th>
            <th class="left">Student Name</th>
            ${prerequisiteHeadersHTML}
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `;

  // Generate header
  const headerHTML = `
    <div class="outputHeader">
      <header class="header">
        <h2>${courseName}</h2>
        <h3>${professorName}</h3>
        <h4>LEC Number: ${lecNum}</h4>
        <h4>LAB Number: ${labNum}</h4>
      </header>
    </div>
  `;

  // Construct the final HTML by combining the header and table
  const outputHTML = `
    ${headerHTML}
    <div class="outputTable">
      ${tableElementHTML}
    </div>
  `;

  // Add HTML to the output div
  const outputDiv = document.getElementById('output');
  outputDiv.innerHTML = outputHTML;

  // Apply color coding to each row
  setTimeout(() => {
    const rows = Array.from(document.querySelectorAll(`#${tableId} tbody tr`));
    rows.forEach(colorCodeCells);
  }, 0);

  return outputHTML;
}
