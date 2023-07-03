import { sortStudentsByLastNameFirstNameID } from './studentSorting.js';

export function generateHTMLTable(parsedData) {
  // Start the HTML string
  let html = `<h2>${parsedData.course}</h2>`;
  html += `<h3>Professor: ${parsedData.professor}</h3>`;
  if (parsedData.lecNum) {
    html += `<h3>LEC: ${parsedData.lecNum}</h3>`;
  }
  if (parsedData.labNum) {
    html += `<h3>LAB: ${parsedData.labNum}</h3>`;
  }

  // Start the table
  html += `<table border="1">`;
  html += `<tr><th>Last Name</th><th>First Name</th><th>W-id</th>`;

  // Add a column header for each prerequisite course
  for (let course in parsedData.prerequisiteCourses) {
    html += `<th>${course}</th>`;
  }
  html += `</tr>`;

  // Collect all the students
  let students = {};
  for (let course in parsedData.prerequisiteCourses) {
    for (let student of parsedData.prerequisiteCourses[course]) {
      if (!students[student.studentID]) {
        students[student.studentID] = {
          lastName: student.lastName,
          firstName: student.firstName,
          studentID: student.studentID,
          courses: {}
        };
      }
      students[student.studentID].courses[course] = true;
    }
  }

  // Convert the students object into an array
  let studentsArray = Object.values(students);

  // Sort the students array
  studentsArray = sortStudentsByLastNameFirstNameID(studentsArray);

  // Add a row for each student
  for (let student of studentsArray) {
    html += `<tr>`;
    html += `<td>${student.lastName}</td>`;
    html += `<td>${student.firstName}</td>`;
    html += `<td>${student.studentID}</td>`;
    for (let course in parsedData.prerequisiteCourses) {
      html += `<td>${student.courses[course] ? '✓' : ''}</td>`;
    }
    html += `</tr>`;
  }

  // End the table
  html += `</table>`;

  // Return the generated HTML
  return html;
}
