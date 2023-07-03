import { parseClassData } from './parseClassData.js';
import { generateHTMLTable } from './generateHTMLTable.js';
import { sortStudentsByLastNameFirstNameID } from './studentSorting.js';

function onSubmit() {
  // Parse the class data
  const parsedData = parseClassData();

  // Generate the HTML table and display it in the output div
  if (parsedData) {
    // Collect all the students
    let students = [];
    for (let course in parsedData.prerequisiteCourses) {
      for (let student of parsedData.prerequisiteCourses[course]) {
        const existingStudent = students.find(s => s.studentID === student.studentID);
        if (existingStudent) {
          existingStudent.courses[course] = true;
        } else {
          students.push({
            lastName: student.lastName,
            firstName: student.firstName,
            studentID: student.studentID,
            courses: { [course]: true },
          });
        }
      }
    }

    // Sort the students array
    students = sortStudentsByLastNameFirstNameID(students);

    // Generate the HTML table and display it in the output div
    const htmlTable = generateHTMLTable(parsedData);
    document.getElementById('output').innerHTML = htmlTable;
  }
}

// Function to reset the form and output div
function onReset() {
  // Clear the textarea and output div
  document.getElementById('inputText').value = '';
  document.getElementById('output').innerHTML = '';
}

// Attach the onSubmit function to the submit button
document.getElementById('submit').addEventListener('click', onSubmit);

// Attach the onReset function to the reset button
document.getElementById('reset').addEventListener('click', onReset);
