import { getState, setState } from './state.js';
import { showDialog } from './dialogHandler.js';

function cleanString(str) {
  return str.replace(/\s+/g, ' ').trim();
}

export function parseIndirectClassData() {
  return new Promise((resolve) => {
    const prerequisiteData = document.getElementById('indirectPrerequisiteData').value;
    const indirectPrerequisiteStatus = document.getElementById('indirectPrerequisiteStatus');
    
    // Check if the data includes 'Indirect Prerequisite Checker'
    if (/Indirect Prerequisite Checker.*(Professor|Instructor)/is.test(prerequisiteData)) {
      const parsedIndirectClassData = parseIndirectPrerequisiteData(prerequisiteData);

      // Extract the necessary data for confirmation
      const { professor, course, lecNum, labNum } = parsedIndirectClassData;

      // Get the roster data from the state
      const rosterData = getState().rosterData;
      
      console.log('Parsed professor length:', parsedIndirectClassData.professor.length);
      console.log('Roster professor length:', rosterData.professor.length);
      
      console.log('Parsed course length:', parsedIndirectClassData.course.length);
      console.log('Roster course length:', rosterData.course.length);
      
      console.log('Parsed LEC number length:', parsedIndirectClassData.lecNum.length);
      console.log('Roster LEC number length:', rosterData.lecNum.length);
      
      console.log('Parsed LAB number length:', parsedIndirectClassData.labNum.length);
      console.log('Roster LAB number length:', rosterData.labNum.length);
      

      for (let i = 0; i < Math.max(parsedIndirectClassData.course.length, rosterData.course.length); i++) {
        if (parsedIndirectClassData.course[i] !== rosterData.course[i]) {
          console.log(`Mismatch at index ${i}: parsed is '${parsedIndirectClassData.course[i]}', roster is '${rosterData.course[i]}'`);
          break;
        }
      }

      if (
        parsedIndirectClassData.professor.trim().toLowerCase() === rosterData.professor.trim().toLowerCase() &&
        parsedIndirectClassData.course.trim().toLowerCase() === rosterData.course.trim().toLowerCase() &&
        parsedIndirectClassData.lecNum.trim().toLowerCase() === rosterData.lecNum.trim().toLowerCase() &&
        parsedIndirectClassData.labNum.trim().toLowerCase() === rosterData.labNum.trim().toLowerCase()
      ) {
        // If they match, store the parsed data in the state and resolve the promise
        setState({ indirectClassData: parsedIndirectClassData });
        indirectPrerequisiteStatus.innerText = 'Indirect class data processed successfully.';
        indirectPrerequisiteStatus.classList.remove('status-bad', 'status-default');
        indirectPrerequisiteStatus.classList.add('status-good');
        resolve(parsedIndirectClassData);
      } else {
        // If they don't match, show a dialog with the difference and clear the textbox and the state
        showDialog(`The class data doesn't match the roster data: <br>
          <strong>Professor:</strong> ${parsedIndirectClassData.professor} vs ${rosterData.professor} <br>
          <strong>Course:</strong> ${parsedIndirectClassData.course} vs ${rosterData.course}<br>
          <strong>LEC Number:</strong> ${parsedIndirectClassData.lecNum} vs ${rosterData.lecNum}<br>
          <strong>LAB Number:</strong> ${parsedIndirectClassData.labNum} vs ${rosterData.labNum}`);
        document.getElementById('indirectPrerequisiteData').value = '';
        setState({ indirectClassData: null });
        resolve(null);
      }
    } else {

      // Identify which checker is present
      let checkerType;
      if (/Class Roster.*(Professor|Instructor)/is.test(prerequisiteData)) {
        checkerType = 'Class Roster';
      } else if (/Prerequisite Checker(?! Indirect).*(Professor|Instructor)/is.test(prerequisiteData)) {
        checkerType = 'Prerequisite';
      }

      if (checkerType) {
        // Update the status indicator with failure
        indirectPrerequisiteStatus.innerText = 'Invalid data provided. Please paste the Indirect Prerequisite data.';
        indirectPrerequisiteStatus.classList.remove('status-good', 'status-default');
        indirectPrerequisiteStatus.classList.add('status-bad');
        // The user is trying to paste incorrect data, show an error dialog
        showDialog(`It looks like you are trying to paste ${checkerType} data into the Indirect Prerequisite field.`)
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('indirectPrerequisiteData').value = '';
          resolve(null); // Resolve the promise with null as no indirect prerequisite data was parsed
        });
      } else {
        // The data doesn't match any known headers, remind the user to select all
        // Update the status indicator with failure
        indirectPrerequisiteStatus.innerText = 'No recognizable data found. Please ensure you have copied the full page.';
        indirectPrerequisiteStatus.classList.remove('status-good', 'status-default');
        indirectPrerequisiteStatus.classList.add('status-bad');
        showDialog('Please ensure you have copied the full page by using Ctrl+A (or Cmd+A on Mac).')
        .then(() => {
          // After user has interacted with the dialog, clear the textbox
          document.getElementById('indirectPrerequisiteData').value = '';
          resolve(null); // Resolve the promise with null as no roster data was parsed
        });
      }
    }
  });
}

function parseIndirectPrerequisiteData(prerequisiteData) {
  try {

       // Initialize the variables
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
       } else {
         throw new Error("Course information not found.");
       }

       // Extract LEC and LAB numbers
       const meetingsMatch = prerequisiteData.match(/(LEC|LAB)\s*-\s*(\d{5})|(LEC|LAB)\s*\((\d{5})\)/gi);
       if (meetingsMatch) {
         meetingsMatch.forEach((match) => {
           const innerMatch = match.match(/(LEC|LAB)\s*(?:-\s*|\()\s*(\d{5})/i);
           if (innerMatch) {
             if (innerMatch[1].toUpperCase() === 'LEC') {
               lecNum = innerMatch[2] || null;
             } else if (innerMatch[1].toUpperCase() === 'LAB') {
               labNum = innerMatch[2] || null;
             }
           }
         });
       } else {
         throw new Error("Meeting information not found.");
       }

       // Extract indirect prerequisite course line and students
       let prerequisiteSectionMatch = prerequisiteData.match(/PREREQUISITE COURSES INDIRECTLY([\s\S]+)$/i);
       if (prerequisiteSectionMatch) {
         let prerequisiteSection = prerequisiteSectionMatch[1];
         let prerequisiteMatches = prerequisiteSection.match(/([A-Z]+\s\d+:)?\n([\s\S]+?)(?=\n[A-Z]+\s\d+:|$)/gi);
       
         if (prerequisiteMatches) {
           let shouldStopProcessing = false;
           for (let match of prerequisiteMatches) {
             let prerequisiteCourseMatch = match.match(/([A-Z]+\s\d+:)/i);
             let studentLines = match.replace(prerequisiteCourseMatch[0], "").trim().split('\n');
       
             if (prerequisiteCourseMatch) {
               currentPrerequisite = prerequisiteCourseMatch[0].trim();
             }
       
             for (let line of studentLines) {
               if (line.startsWith('Class rosters were last updated')) {
                 shouldStopProcessing = true;
                 break;
               }
       
               prerequisiteCourses[currentPrerequisite] = prerequisiteCourses[currentPrerequisite] || [];
       
               if (line.trim() === '' || !line.includes('\t')) {
                 continue;
               }
       
               let [, , studentID] = line.split('\t');
               prerequisiteCourses[currentPrerequisite].push(studentID.trim());
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
    console.error("Error occurred while parsing indirect class data:", error.message);
    showDialog(`Error occurred while parsing indirect class data: ${error.message}`);
    return null;
  }
}
