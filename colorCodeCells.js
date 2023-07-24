export function colorCodeCells(row) {
    const cells = Array.from(row.getElementsByTagName('td'));
    const totalCourses = cells.length - 2; // subtract student ID and name cells
    const takenCourses = cells.filter(cell => cell.classList.contains('taken')).length;
  
    row.classList.remove('no-courses-taken', 'all-courses-taken', 'some-courses-taken');
    
    // Remove the student-info class from the student ID and student name cells
    cells[0].classList.remove('student-info');
    cells[1].classList.remove('student-info');
  
    if (takenCourses === 0) {
      row.classList.add('no-courses-taken');
    } else if (takenCourses === totalCourses) {
      row.classList.add('all-courses-taken');
    } else {
      row.classList.add('some-courses-taken');
      // Add the student-info class to the student ID and student name cells
      cells[0].classList.add('student-info');
      cells[1].classList.add('student-info');
    }
  }
  