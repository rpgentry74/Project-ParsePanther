export function sortStudentsByLastNameFirstNameID(students) {
    return students.sort((a, b) => {
      // Sort by last name
      if (a.lastName !== b.lastName) {
        return a.lastName.localeCompare(b.lastName);
      }
  
      // If last names are the same, sort by first name
      if (a.firstName !== b.firstName) {
        return a.firstName.localeCompare(b.firstName);
      }
  
      // If first names are the same, sort by ID
      return a.studentID.localeCompare(b.studentID);
    });
  }
  