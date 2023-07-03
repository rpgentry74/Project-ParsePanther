export function parseClassData() {
    try {
      // Get the class data from the text box in the HTML form
      let classData = document.getElementById('inputText').value;
  
      // Initialize the variables
      let professor, course;
      let lecNum = null;
      let labNum = null;
      let prerequisiteCourses = {};
      let currentPrerequisite = "";
  
      // Extract professor's name
      let professorMatch = classData.match(/Professor:\s+(.+)/);
      if (professorMatch) {
        professor = professorMatch[1];
      } else {
        throw new Error("Professor information not found.");
      }
  
      // Extract course information
      let courseMatch = classData.match(/Course:\s+(.+)/);
      if (courseMatch) {
        course = courseMatch[1];
      } else {
        throw new Error("Course information not found.");
      }
  
      // Extract LEC and LAB numbers
      let meetingsMatch = classData.match(/(LEC|LAB)\s*-\s*(\d{5})|(LEC|LAB)\s*\((\d{5})\)/gi);
  
      if (meetingsMatch) {
        meetingsMatch.forEach((match) => {
          let innerMatch = match.match(/(LEC|LAB)\s*(?:-\s*|\()\s*(\d{5})/i);
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
  
      // Extract prerequisite course line and students
      let prerequisiteSectionMatch = classData.match(/Prerequisite Courses Completed Within Los Rios([\s\S]+)$/i);
      if (prerequisiteSectionMatch) {
        let prerequisiteSection = prerequisiteSectionMatch[1];
        let prerequisiteMatches = prerequisiteSection.match(/([A-Z]+\s\d+:)?\n([\s\S]+?)(?=\n[A-Z]+\s\d+:|$)/gi);
  
        if (prerequisiteMatches) {
          for (let match of prerequisiteMatches) {
            let prerequisiteCourseMatch = match.match(/([A-Z]+\s\d+:)/i);
            let studentLines = match.replace(prerequisiteCourseMatch[0], "").trim().split('\n');
  
            if (prerequisiteCourseMatch) {
              currentPrerequisite = prerequisiteCourseMatch[0].trim();
            }
  
            prerequisiteCourses[currentPrerequisite] = [];
  
            for (let line of studentLines) {
              // Skip if line is empty or doesn't contain a tab
              if (line.trim() === '' || !line.includes('\t')) {
                continue;
              }
  
              // Skip the line if it matches the header line
              if (line === "Last Name\tFirst Name\tStudent ID\tTerm Completed\tCollege") {
                continue;
              }
  
              let [lastName, firstName, studentID] = line.split('\t');
              prerequisiteCourses[currentPrerequisite].push({ lastName, firstName, studentID });
            }
          }
        } else {
          throw new Error("No prerequisite course information found.");
        }
      } else {
        throw new Error("Prerequisite section not found.");
      }
  
      // Log the parsed data for testing purposes
      console.log("Parsed data:");
      console.log("Professor: " + professor);
      console.log("Course: " + course);
      console.log("LEC Number: " + lecNum);
      console.log("LAB Number: " + labNum);
      console.log("Prerequisite Courses: ", prerequisiteCourses);
  
      // Store the parsed data in a local variable
      let parsedData = {
        professor,
        course,
        lecNum,
        labNum,
        prerequisiteCourses
      };
  
      // Return the extracted data
      return parsedData;
    } catch (error) {
      // Handle the error
      console.error("Error occurred while parsing class data:", error.message);
      // Optionally, you can display an error message to the user or perform other error handling tasks.
      return null; // Return null or an appropriate value to indicate an error condition.
    }
  }
  