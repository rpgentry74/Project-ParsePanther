// Import the state functions
import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

function cleanString(str) {
  return str.replace(/\s+/g, ' ').trim();
}

export function parseRosterData() {
  return new Promise((resolve) => {
    // Get the roster data from the text box in the HTML form
    const rosterData = cleanString(document.getElementById('rosterData').value); // Added cleaning operation here
    const rosterStatus = document.getElementById('rosterStatus');
    
    // Check if the data includes 'Class Roster'
    if (/Class Rosters?.*(Professor|Instructor)/is.test(rosterData)) {
      const parsedRosterData = parseClassRosterData(rosterData);

      // Extract the necessary data for confirmation
      const { professor, course, lecNum, labNum } = parsedRosterData;

      // Show the dialog with the parsed data for confirmation
      showDialog(`Is this information correct? <br>
      <strong>Professor:</strong> ${professor} <br>
      <strong>Course:</strong> ${course}<br>
      <strong>LEC Number:</strong> ${lecNum}<br>
      <strong>LAB Number:</strong> ${labNum}`, true)

      .then((confirmed) => {
        if (confirmed) {
          // Store the parsed data in the state
          setState({ rosterData: parsedRosterData });

          // Hide the overlay
          document.getElementById('disableUntilRosterAccepted').style.display = 'none';

          // Update the status indicator with success
          rosterStatus.innerText = 'Roster data processed successfully.';
          rosterStatus.classList.remove('status-bad', 'status-default');
          rosterStatus.classList.add('status-good');
          resolve(parsedRosterData); // Resolve the promise with the parsed data
        } else {
          // If the user does not confirm, clear the textbox and the state
          document.getElementById('rosterData').value = '';
          setState({ rosterData: null });
          // Update the status indicator with failure
          rosterStatus.innerText = 'Roster data processing cancelled by user.';
          rosterStatus.classList.remove('status-good', 'status-default');
          rosterStatus.classList.add('status-bad');
          resolve(null); // Resolve the promise with null as no roster data was parsed
        }
      });
    } else {
      // Extract the portion of the text before 'Professor' or 'Instructor'
      const headerData = cleanString(rosterData.match(/^(.*?)(?=Professor|Instructor)/s)[0]); // Added cleaning operation here
 
      // Identify which checker is present
      let checkerType;
      if (/Indirect Prerequisite Checker.*(Professor|Instructor)/is.test(rosterData)) {
        checkerType = 'Indirect Prerequisite';
      } else if (/Prerequisite Checker(?! Indirect).*(Professor|Instructor)/is.test(rosterData)) {
        checkerType = 'Prerequisite';
      }

      if (checkerType) {
        // Update the status indicator with failure
        rosterStatus.innerText = 'Invalid data provided. Please paste the Class Roster data.';
        rosterStatus.classList.remove('status-good', 'status-default');
        rosterStatus.classList.add('status-bad');
        // The user is trying to paste prerequisite data, show an error dialog
        showDialog(`It looks like you are trying to paste ${checkerType} data into the Class Roster field. Please ensure you paste the Class Roster data first.`)
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('rosterData').value = '';
          resolve(null); // Resolve the promise with null as no roster data was parsed
        });
      } else {
        // The data doesn't match any known headers, remind the user to select all
        // Update the status indicator with failure
        rosterStatus.innerText = 'No recognizable data found. Please ensure you have copied the full page.';
        rosterStatus.classList.remove('status-good', 'status-default');
        rosterStatus.classList.add('status-bad');
        showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).')
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('rosterData').value = '';
          resolve(null); // Resolve the promise with null as no roster data was parsed
        });
      }
    }
  });
}

function parseClassRosterData(rosterData) {
  try {
    // Initialize the variables
    let professor, course;
    let lecNum = null;
    let labNum = null;
    const studentRoster = [];

    // Extract professor's name
    const professorMatch = rosterData.match(/Professor:\s+(.+?)(?= Course:| Meetings:)/);
    if (professorMatch) {
      professor = cleanString(professorMatch[1]);  // Added cleaning operation here
    } else {
      throw new Error("Professor information not found.");
    }

    // Extract course information
    const courseMatch = rosterData.match(/Course:\s+(.+?)(?= Meetings:| Professor:)/);
    if (courseMatch) {
      course = cleanString(courseMatch[1]);  // Added cleaning operation here
    } else {
      throw new Error("Course information not found.");
    }

    // Extract LEC and LAB numbers
    const meetingsMatch = rosterData.match(/(LEC|LAB)\s*-\s*(\d{5})|(LEC|LAB)\s*\((\d{5})\)/gi);
    if (meetingsMatch) {
      meetingsMatch.forEach((match) => {
        const innerMatch = match.match(/(LEC|LAB)\s*(?:-\s*|\()\s*(\d{5})/i);
        if (innerMatch) {
          if (innerMatch[1].toUpperCase() === 'LEC') {
            lecNum = cleanString(innerMatch[2]) || null;  // Added cleaning operation here
          } else if (innerMatch[1].toUpperCase() === 'LAB') {
            labNum = cleanString(innerMatch[2]) || null;  // Added cleaning operation here
          }
        }
      });
    } else {
      throw new Error("Meeting information not found.");
    }

    // Extract student roster information
    const studentMatches = rosterData.matchAll(/(\d{1,3}\.\s+)([^\(]+?)(?:\s+\(|\s+)(\d{7})/g);
    if (studentMatches) {
      for (let match of studentMatches) {
        const [, , studentName, studentID] = match;
        const trimmedStudentName = cleanString(studentName.trim());  // Added cleaning operation here
    
        // Check if the current line contains the stop headers
        if (trimmedStudentName.startsWith("Dropped Students") || trimmedStudentName.startsWith("Drops")) {
          break; // Stop parsing if either header is encountered
        }
    
        studentRoster.push({ studentID, studentName: trimmedStudentName });
      }
    } else {
      throw new Error("No student roster information found.");
    }
    

    // Log the parsed data for testing purposes
    console.log("Parsed data:");
    console.log("Professor: " + professor);
    console.log("Course: " + course);
    console.log("LEC Number: " + lecNum);
    console.log("LAB Number: " + labNum);
    console.log("Student Roster: ", studentRoster);

    // Return the extracted data
    return {
      professor,
      course,
      lecNum,
      labNum,
      studentRoster,
    };

  } catch (error) {
    // Handle the error
    console.error("Error occurred while parsing roster data:", error.message);
    // Optionally, you can display an error message to the user or perform other error handling tasks.
    return null; // Return null or an appropriate value to indicate an error condition.
  }
}
