import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

function cleanString(str) {
  return str.replace(/\s+/g, ' ').trim();
}

export function parseClassData() {
  return new Promise((resolve) => {
    const prerequisiteData = document.getElementById('prerequisiteData').value;
    const prerequisiteStatus = document.getElementById('prerequisiteStatus');
    
    if (/Prerequisite Checker(?! Indirect)?.*(Professor|Instructor)/is.test(prerequisiteData)) {
      const parsedPrerequisiteData = parsePrerequisiteData(prerequisiteData);
      const { professor, course, lecNum, labNum } = parsedPrerequisiteData;
      const rosterData = getState().rosterData;

      // Handling null values
      const doLecNumsMatch = (lecNum === null && rosterData.lecNum === null) || 
      (lecNum && rosterData.lecNum && lecNum.trim().toLowerCase() === rosterData.lecNum.trim().toLowerCase());

      const doLabNumsMatch = (labNum === null && rosterData.labNum === null) ||
      (labNum && rosterData.labNum && labNum.trim().toLowerCase() === rosterData.labNum.trim().toLowerCase());

      if (professor.trim().toLowerCase() === rosterData.professor.trim().toLowerCase() &&
      course.trim().toLowerCase() === rosterData.course.trim().toLowerCase() &&
      doLecNumsMatch && doLabNumsMatch) {

        setState({ prerequisiteData: parsedPrerequisiteData });
        prerequisiteStatus.innerText = 'Prerequisite data processed successfully.';
        prerequisiteStatus.classList.remove('status-bad', 'status-default');
        prerequisiteStatus.classList.add('status-good');
        resolve(parsedPrerequisiteData);

      } else {
        showDialog(`The prerequisite data doesn't match the roster data: <br>
          <strong>Professor:</strong> ${professor} vs ${rosterData.professor} <br>
          <strong>Course:</strong> ${course} vs ${rosterData.course}<br>
          <strong>LEC Number:</strong> ${lecNum || 'N/A'} vs ${rosterData.lecNum || 'N/A'}<br>
          <strong>LAB Number:</strong> ${labNum || 'N/A'} vs ${rosterData.labNum || 'N/A'}`, true)
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
      let checkerType;
      if (/Class Roster.*(Professor|Instructor)/is.test(prerequisiteData)) {
        checkerType = 'Class Roster';
      } else if (/Indirect Prerequisite Checker.*(Professor|Instructor)/is.test(prerequisiteData)) {
        checkerType = 'Indirect Prerequisite';
      }

      if (checkerType) {
        prerequisiteStatus.innerText = 'Invalid data provided. Please paste the  Prerequisite data.';
        prerequisiteStatus.classList.remove('status-good', 'status-default');
        prerequisiteStatus.classList.add('status-bad');
        showDialog(`It looks like you are trying to paste ${checkerType} data into the  Prerequisite field.`)
        .then(() => {
          document.getElementById('prerequisiteData').value = '';
          resolve(null);
        });
      } else {
        prerequisiteStatus.innerText = 'No recognizable data found. Please ensure you have copied the full page.';
        prerequisiteStatus.classList.remove('status-good', 'status-default');
        prerequisiteStatus.classList.add('status-bad');
        showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).')
        .then(() => {
          document.getElementById('prerequisiteData').value = '';
          resolve(null);
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

