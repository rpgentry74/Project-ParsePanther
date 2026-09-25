// prerequisiteDataUtils.js

function normalizePrerequisiteName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/:\s*$/, '')
    .trim();
}

function normalizeStudentId(studentId) {
  return String(studentId ?? '').trim();
}

export function mergePrerequisiteCourses(directPrerequisiteData, indirectPrerequisiteData) {
  const mergedCourses = new Map();

  for (const source of [directPrerequisiteData, indirectPrerequisiteData]) {
    const prerequisiteCourses = source?.prerequisiteCourses;

    if (!prerequisiteCourses || typeof prerequisiteCourses !== 'object') {
      continue;
    }

    for (const [rawCourseName, rawStudentIds] of Object.entries(prerequisiteCourses)) {
      const courseName = normalizePrerequisiteName(rawCourseName);

      if (!courseName) {
        continue;
      }

      if (!mergedCourses.has(courseName)) {
        mergedCourses.set(courseName, new Set());
      }

      if (!Array.isArray(rawStudentIds)) {
        continue;
      }

      const studentIds = mergedCourses.get(courseName);

      for (const rawStudentId of rawStudentIds) {
        const studentId = normalizeStudentId(rawStudentId);

        if (studentId) {
          studentIds.add(studentId);
        }
      }
    }
  }

  return Object.fromEntries(
    Array.from(mergedCourses, ([courseName, studentIds]) => [
      courseName,
      Array.from(studentIds),
    ])
  );
}
