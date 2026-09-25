export function colorCodeCells(row) {
  const cells = Array.from(row.getElementsByTagName('td'));
  const totalCourses = cells.length - 2;
  const takenCourses = cells.filter((cell) =>
    cell.classList.contains('taken')
  ).length;

  row.classList.remove(
    'no-courses-taken',
    'all-courses-taken',
    'some-courses-taken'
  );

  if (totalCourses <= 0) {
    cells[0]?.classList.add('student-info');
    cells[1]?.classList.add('student-info');
    return;
  }

  cells[0]?.classList.remove('student-info');
  cells[1]?.classList.remove('student-info');

  if (takenCourses === 0) {
    row.classList.add('no-courses-taken');
  } else if (takenCourses === totalCourses) {
    row.classList.add('all-courses-taken');
  } else {
    row.classList.add('some-courses-taken');
    cells[0]?.classList.add('student-info');
    cells[1]?.classList.add('student-info');
  }
}
