import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

function cleanString(str) {
  return str.replace(/\s+/g, ' ').trim();
}

export function parseClassData() {
  return new Promise((resolve) => {
    const prerequisiteData = document.getElementById('prerequisiteData').value;
    const prerequisiteStatus = document.getElementById('prerequisiteStatus');
    
    // Check if the data includes 'Prerequisite Checker'
    if (/Prerequisite Checker(?! Indirect)?.*(Professor|Instructor)/is.test(prerequisiteData)) {
      const parsedPrerequisiteData = parsePrerequisiteData(prerequisiteData);

      // Extract the necessary data for confirmation
      const { professor, course, lecNum, labNum } = parsedPrerequisiteData;

      // Get the roster data from the state
      const rosterData = getState().rosterData;

      console.log('Parsed course length:', parsedPrerequisiteData.course.length);
      console.log('Roster course length:', rosterData.course.length);

      for (let i = 0; i < Math.max(parsedPrerequisiteData.course.length, rosterData.course.length); i++) {
        if (parsedPrerequisiteData.course[i] !== rosterData.course[i]) {
          console.log(`Mismatch at index ${i}: parsed is '${parsedPrerequisiteData.course[i]}', roster is '${rosterData.course[i]}'`);
          break;
        }
      }


      if (parsedPrerequisiteData.professor.trim().toLowerCase() === rosterData.professor.trim().toLowerCase() &&
      parsedPrerequisiteData.course.trim().toLowerCase() === rosterData.course.trim().toLowerCase() &&
      parsedPrerequisiteData.lecNum.trim().toLowerCase() === rosterData.lecNum.trim().toLowerCase() &&
      parsedPrerequisiteData.labNum.trim().toLowerCase() === rosterData.labNum.trim().toLowerCase()) {

        // If they match, store the parsed data in the state and resolve the promise
        setState({ prerequisiteData: parsedPrerequisiteData });
        prerequisiteStatus.innerText = 'Prerequisite data processed successfully.';
        prerequisiteStatus.classList.remove('status-bad', 'status-default');
        prerequisiteStatus.classList.add('status-good');
        resolve(parsedPrerequisiteData);
      } else {
        showDialog(`The prerequisite data doesn't match the roster data: <br>
          <strong>Professor:</strong> ${parsedPrerequisiteData.professor} vs ${rosterData.professor} <br>
          <strong>Course:</strong> ${parsedPrerequisiteData.course} vs ${rosterData.course}<br>
          <strong>LEC Number:</strong> ${parsedPrerequisiteData.lecNum} vs ${rosterData.lecNum}<br>
          <strong>LAB Number:</strong> ${parsedPrerequisiteData.labNum} vs ${rosterData.labNum}`, true)
        .then(() => {
          document.getElementById('prerequisiteData').value = '';
          setState({ prerequisiteData: null });
          prerequisiteStatus.innerText = 'Prerequisite data processing cancelled by user.';
          prerequisiteStatus.classList.remove('status-good', 'status-default');
          prerequisiteStatus.classList.add('status-bad');
          resolve(null);
        });
      }
    } else {

      // Identify which checker is present
      let checkerType;
      if (/Class Roster.*(Professor|Instructor)/is.test(prerequisiteData)) {
        checkerType = 'Class Roster';
      } else if (/Indirect Prerequisite Checker.*(Professor|Instructor)/is.test(rosterData)) {
        checkerType = 'Indirect Prerequisite';
      }

      if (checkerType) {
        // Update the status indicator with failure
        prerequisiteStatus.innerText = 'Invalid data provided. Please paste the  Prerequisite data.';
        prerequisiteStatus.classList.remove('status-good', 'status-default');
        prerequisiteStatus.classList.add('status-bad');
        // The user is trying to paste incorrect data, show an error dialog
        showDialog(`It looks like you are trying to paste ${checkerType} data into the  Prerequisite field.`)
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('prerequisiteData').value = '';
          resolve(null); // Resolve the promise with null as no  prerequisite data was parsed
        });
      } else {
        // The data doesn't match any known headers, remind the user to select all
        // Update the status indicator with failure
        prerequisiteStatus.innerText = 'No recognizable data found. Please ensure you have copied the full page.';
        prerequisiteStatus.classList.remove('status-good', 'status-default');
        prerequisiteStatus.classList.add('status-bad');
        showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).')
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('prerequisiteData').value = '';
          resolve(null); // Resolve the promise with null as no roster data was parsed
        });
      }
    }
  });
}

function parsePrerequisiteData(prerequisiteData) {
  try {
    console.log("Prerequisite data:", prerequisiteData);  // Log the prerequisite data being processed

    let professor, course;
    let lecNum = null;
    let labNum = null;
    const prerequisiteCourses = {};
    let currentPrerequisite = "";

    // Extract professor's name    
    const professorMatch = prerequisiteData.match(/Professor:\s+(.+)/);
    if (professorMatch) {
      professor = professorMatch[1];
      console.log("Parsed professor:", professor);  // Log the parsed professor
    } else {
      throw new Error("Professor information not found.");
    }

    // Extract course information
    const courseMatch = prerequisiteData.match(/Course:\s+(.+)/);
    if (courseMatch) {
      course = courseMatch[1].replace(/\s+/g, ' ').trim();
      console.log("Parsed course:", course);  // Log the parsed course
    } else {
      throw new Error("Course information not found.");
    }

    const meetingsMatch = prerequisiteData.match(/(LEC|LAB)\s*-\s*(\d{5})|(LEC|LAB)\s*\((\d{5})\)/gi);
    if (meetingsMatch) {
      meetingsMatch.forEach((match) => {
        const innerMatch = match.match(/(LEC|LAB)\s*(?:-\s*|\()\s*(\d{5})/i);
        if (innerMatch) {
          if (innerMatch[1].toUpperCase() === 'LEC') {
            lecNum = innerMatch[2] || null;
            console.log("Parsed LEC number:", lecNum);  // Log the parsed LEC number
          } else if (innerMatch[1].toUpperCase() === 'LAB') {
            labNum = innerMatch[2] || null;
            console.log("Parsed LAB number:", labNum);  // Log the parsed LAB number
          }
        }
      });
    } else {
      throw new Error("Meeting information not found.");
    }

    const prerequisiteSectionMatch = prerequisiteData.match(/Prerequisite Courses Completed Within Los Rios([\s\S]+)$/i);
    if (prerequisiteSectionMatch) {
      let prerequisiteSection = prerequisiteSectionMatch[1];
      console.log("Prerequisite section:", prerequisiteSection.replace(/\t/g, "[TAB]"));
      let prerequisiteMatches = prerequisiteSection.match(/([A-Z]+\s\d+:)?\n([\s\S]+?)(?=\n[A-Z]+\s\d+:|$)/gi);

      if (prerequisiteMatches) {
        let shouldStopProcessing = false;
        for (let match of prerequisiteMatches) {
          let prerequisiteCourseMatch = match.match(/([A-Z]+\s\d+:)/i);
          let studentLines = (match.replace(prerequisiteCourseMatch[0], "")).split('\n');  

          if (prerequisiteCourseMatch) {
            currentPrerequisite = prerequisiteCourseMatch[0].trim();  
            console.log("Current prerequisite:", currentPrerequisite);  // Log the current prerequisite
          }

          for (let line of studentLines) {
            console.log("Processing line:", line);  // Log the line being processed
            if (line.startsWith('Class rosters were last updated')) {
              shouldStopProcessing = true;
              break;
            }

            prerequisiteCourses[currentPrerequisite] = prerequisiteCourses[currentPrerequisite] || [];

            if (line.trim() === '' || !line.includes('\t')) {
              continue;
            }

            if (line === "Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege") {
              continue;
            }

            let [, , studentID] = line.split('\t');
            prerequisiteCourses[currentPrerequisite].push(studentID.trim());  
            console.log("Added student ID:", studentID, "to", currentPrerequisite);  // Log the student ID and prerequisite course
          }

          if (shouldStopProcessing) {
            break;
          }
        }
      } else {
        throw new Error("No prerequisite course information found.");
      }
    } else {
      throw new Error("Prerequisite section not found.");
    }

    return {
      professor,
      course,
      lecNum,
      labNum,
      prerequisiteCourses,
    };

  } catch (error) {
    showDialog(`Error occurred while parsing class data: ${error.message}`);
    return null;
  }
}

