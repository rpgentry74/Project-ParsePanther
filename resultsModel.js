// resultsModel.js
import { mergePrerequisiteData } from './prerequisiteDataUtils.js';

function buildStatus(prerequisiteCount, missingCount) {
  if (prerequisiteCount === 0) {
    return {
      key: 'neutral',
      className: 'status-neutral',
      text: 'No prerequisites evaluated',
      missingCount: 0,
    };
  }

  if (missingCount === 0) {
    return {
      key: 'complete',
      className: 'status-complete',
      text: 'All prerequisites complete',
      missingCount: 0,
    };
  }

  return {
    key: 'missing',
    className: 'status-missing',
    text: `Missing ${missingCount} prerequisite${missingCount === 1 ? '' : 's'}`,
    missingCount,
  };
}

function buildPrerequisiteModels(
  studentId,
  prerequisiteNames,
  prerequisiteCourses,
  courseAliases,
  prerequisiteEvidenceSources
) {
  return prerequisiteNames.map((courseName) => {
    const completed = prerequisiteCourses[courseName].includes(studentId);

    return {
      courseName,
      aliases: courseAliases[courseName] || [],
      completed,
      evidence:
        prerequisiteEvidenceSources[courseName]?.[studentId] || [],
    };
  });
}

function buildIndirectEvidenceModels(
  studentId,
  indirectEvidenceNames,
  indirectEvidenceCourses,
  indirectEvidenceAliases
) {
  return indirectEvidenceNames
    .filter((courseName) =>
      indirectEvidenceCourses[courseName].includes(studentId)
    )
    .map((courseName) => ({
      courseName,
      aliases: indirectEvidenceAliases[courseName] || [],
    }));
}

export function buildResultsModel(
  rosterData,
  directPrerequisiteData,
  indirectPrerequisiteData
) {
  if (!rosterData) {
    return null;
  }

  const merged = mergePrerequisiteData(
    directPrerequisiteData,
    indirectPrerequisiteData
  );

  const prerequisiteNames = Object.keys(merged.prerequisiteCourses);
  const indirectEvidenceNames = Object.keys(merged.indirectEvidenceCourses);

  const students = rosterData.studentRoster.map((student) => {
    const studentId = String(student.studentID).trim();
    const prerequisites = buildPrerequisiteModels(
      studentId,
      prerequisiteNames,
      merged.prerequisiteCourses,
      merged.courseAliases,
      merged.prerequisiteEvidenceSources
    );

    const missingPrerequisites = prerequisites
      .filter((prerequisite) => !prerequisite.completed)
      .map((prerequisite) => prerequisite.courseName);

    const completedPrerequisites = prerequisites
      .filter((prerequisite) => prerequisite.completed)
      .map((prerequisite) => prerequisite.courseName);

    const indirectEvidence = buildIndirectEvidenceModels(
      studentId,
      indirectEvidenceNames,
      merged.indirectEvidenceCourses,
      merged.indirectEvidenceAliases
    );

    const indirectSupportsPrerequisite = prerequisites.some(
      (prerequisite) =>
        prerequisite.evidence.some((entry) => entry.source === 'indirect')
    );

    const hasIndirectEvidence =
      indirectSupportsPrerequisite || indirectEvidence.length > 0;

    return {
      student,
      studentId,
      prerequisites,
      completedPrerequisites,
      missingPrerequisites,
      indirectEvidence,
      hasIndirectEvidence,
      status: buildStatus(
        prerequisiteNames.length,
        missingPrerequisites.length
      ),
    };
  });

  return {
    ...merged,
    prerequisiteNames,
    indirectEvidenceNames,
    students,
    summary: {
      studentCount: students.length,
      completeCount: students.filter(
        ({ status }) => status.key === 'complete'
      ).length,
      missingCount: students.filter(
        ({ status }) => status.key === 'missing'
      ).length,
      indirectCount: students.filter(
        ({ hasIndirectEvidence }) => hasIndirectEvidence
      ).length,
    },
  };
}
