// prerequisiteDataUtils.js

function normalizePrerequisiteName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/:\s*$/, '')
    .trim()
    .toUpperCase();
}

function normalizeStudentId(studentId) {
  return String(studentId ?? '').trim();
}

function normalizeAliases(rawAliases) {
  if (!Array.isArray(rawAliases)) {
    return [];
  }

  return rawAliases
    .map(normalizePrerequisiteName)
    .filter(Boolean);
}

function addStudentIds(targetSet, rawStudentIds) {
  if (!Array.isArray(rawStudentIds)) {
    return;
  }

  for (const rawStudentId of rawStudentIds) {
    const studentId = normalizeStudentId(rawStudentId);

    if (studentId) {
      targetSet.add(studentId);
    }
  }
}

function addEvidence(
  evidenceMap,
  canonicalName,
  rawStudentIds,
  source,
  sourceCourse
) {
  if (!Array.isArray(rawStudentIds)) {
    return;
  }

  if (!evidenceMap.has(canonicalName)) {
    evidenceMap.set(canonicalName, new Map());
  }

  const courseEvidence = evidenceMap.get(canonicalName);

  for (const rawStudentId of rawStudentIds) {
    const studentId = normalizeStudentId(rawStudentId);

    if (!studentId) {
      continue;
    }

    if (!courseEvidence.has(studentId)) {
      courseEvidence.set(studentId, []);
    }

    const entries = courseEvidence.get(studentId);
    const normalizedSourceCourse =
      normalizePrerequisiteName(sourceCourse) || canonicalName;

    const alreadyPresent = entries.some(
      (entry) =>
        entry.source === source &&
        entry.course === normalizedSourceCourse
    );

    if (!alreadyPresent) {
      entries.push({
        source,
        course: normalizedSourceCourse,
      });
    }
  }
}

function addAliasTarget(aliasTargets, alias, canonicalName, directCanonicalNames) {
  if (!alias || alias === canonicalName) {
    return;
  }

  // Never reinterpret one official Direct prerequisite as another.
  if (
    directCanonicalNames.has(alias) &&
    alias !== canonicalName
  ) {
    return;
  }

  if (!aliasTargets.has(alias)) {
    aliasTargets.set(alias, new Set());
  }

  aliasTargets.get(alias).add(canonicalName);
}

function resolveOfficialCourse(courseName, directCanonicalNames, aliasTargets) {
  if (directCanonicalNames.has(courseName)) {
    return courseName;
  }

  const targets = aliasTargets.get(courseName);

  if (!targets || targets.size !== 1) {
    return null;
  }

  return Array.from(targets)[0];
}

function collectOfficialAliases(
  directPrerequisiteData,
  indirectPrerequisiteData,
  directCanonicalNames
) {
  const aliasTargets = new Map();
  const officialAliases = new Map();

  for (const canonicalName of directCanonicalNames) {
    officialAliases.set(canonicalName, new Set());
  }

  const directAliases = directPrerequisiteData?.courseAliases || {};

  for (const [rawCanonicalName, rawAliases] of Object.entries(directAliases)) {
    const canonicalName = normalizePrerequisiteName(rawCanonicalName);

    if (!directCanonicalNames.has(canonicalName)) {
      continue;
    }

    for (const alias of normalizeAliases(rawAliases)) {
      addAliasTarget(
        aliasTargets,
        alias,
        canonicalName,
        directCanonicalNames
      );

      if (
        alias &&
        alias !== canonicalName &&
        !directCanonicalNames.has(alias)
      ) {
        officialAliases.get(canonicalName).add(alias);
      }
    }
  }

  // A "formerly" relationship shown on the Indirect page is still official
  // course identity information. Use it only when that Indirect heading is
  // already the official Direct course or a uniquely known former alias.
  const indirectAliases = indirectPrerequisiteData?.courseAliases || {};

  for (const [rawCourseName, rawAliases] of Object.entries(indirectAliases)) {
    const courseName = normalizePrerequisiteName(rawCourseName);
    const canonicalName = resolveOfficialCourse(
      courseName,
      directCanonicalNames,
      aliasTargets
    );

    if (!canonicalName) {
      continue;
    }

    for (const alias of normalizeAliases(rawAliases)) {
      addAliasTarget(
        aliasTargets,
        alias,
        canonicalName,
        directCanonicalNames
      );

      if (
        alias &&
        alias !== canonicalName &&
        !directCanonicalNames.has(alias)
      ) {
        officialAliases.get(canonicalName).add(alias);
      }
    }
  }

  return {
    aliasTargets,
    officialAliases,
  };
}

function evidenceMapToObject(evidenceMap) {
  return Object.fromEntries(
    Array.from(evidenceMap, ([courseName, studentMap]) => [
      courseName,
      Object.fromEntries(studentMap),
    ])
  );
}

export function mergePrerequisiteData(
  directPrerequisiteData,
  indirectPrerequisiteData
) {
  const directCourses = directPrerequisiteData?.prerequisiteCourses || {};
  const indirectCourses = indirectPrerequisiteData?.prerequisiteCourses || {};

  const directCanonicalNames = new Set(
    Object.keys(directCourses)
      .map(normalizePrerequisiteName)
      .filter(Boolean)
  );

  const {
    aliasTargets,
    officialAliases,
  } = collectOfficialAliases(
    directPrerequisiteData,
    indirectPrerequisiteData,
    directCanonicalNames
  );

  const evaluatedPrerequisites = new Map();
  const prerequisiteEvidenceSources = new Map();

  for (const canonicalName of directCanonicalNames) {
    evaluatedPrerequisites.set(canonicalName, new Set());
    prerequisiteEvidenceSources.set(canonicalName, new Map());
  }

  for (const [rawCourseName, rawStudentIds] of Object.entries(directCourses)) {
    const courseName = normalizePrerequisiteName(rawCourseName);

    if (!evaluatedPrerequisites.has(courseName)) {
      continue;
    }

    addStudentIds(
      evaluatedPrerequisites.get(courseName),
      rawStudentIds
    );

    addEvidence(
      prerequisiteEvidenceSources,
      courseName,
      rawStudentIds,
      'direct',
      courseName
    );
  }

  const indirectEvidenceCourses = new Map();
  const indirectEvidenceAliases = new Map();
  const rawIndirectAliases = indirectPrerequisiteData?.courseAliases || {};

  for (const [rawCourseName, rawStudentIds] of Object.entries(indirectCourses)) {
    const courseName = normalizePrerequisiteName(rawCourseName);

    if (!courseName) {
      continue;
    }

    const officialCourse = resolveOfficialCourse(
      courseName,
      directCanonicalNames,
      aliasTargets
    );

    if (officialCourse) {
      addStudentIds(
        evaluatedPrerequisites.get(officialCourse),
        rawStudentIds
      );

      addEvidence(
        prerequisiteEvidenceSources,
        officialCourse,
        rawStudentIds,
        'indirect',
        courseName
      );
      continue;
    }

    if (!indirectEvidenceCourses.has(courseName)) {
      indirectEvidenceCourses.set(courseName, new Set());
    }

    addStudentIds(
      indirectEvidenceCourses.get(courseName),
      rawStudentIds
    );

    const aliases = normalizeAliases(rawIndirectAliases[rawCourseName]);

    if (aliases.length) {
      indirectEvidenceAliases.set(
        courseName,
        new Set(
          aliases.filter((alias) => alias !== courseName)
        )
      );
    }
  }

  return {
    prerequisiteCourses: Object.fromEntries(
      Array.from(evaluatedPrerequisites, ([courseName, studentIds]) => [
        courseName,
        Array.from(studentIds),
      ])
    ),
    courseAliases: Object.fromEntries(
      Array.from(officialAliases, ([courseName, aliases]) => [
        courseName,
        Array.from(aliases),
      ])
    ),
    prerequisiteEvidenceSources:
      evidenceMapToObject(prerequisiteEvidenceSources),
    indirectEvidenceCourses: Object.fromEntries(
      Array.from(indirectEvidenceCourses, ([courseName, studentIds]) => [
        courseName,
        Array.from(studentIds),
      ])
    ),
    indirectEvidenceAliases: Object.fromEntries(
      Array.from(indirectEvidenceAliases, ([courseName, aliases]) => [
        courseName,
        Array.from(aliases),
      ])
    ),
  };
}

export function mergePrerequisiteCourses(
  directPrerequisiteData,
  indirectPrerequisiteData
) {
  return mergePrerequisiteData(
    directPrerequisiteData,
    indirectPrerequisiteData
  ).prerequisiteCourses;
}

export function formatPrerequisiteDisplayName(
  courseName,
  aliases = [],
  separator = '\n'
) {
  const normalizedCourseName = normalizePrerequisiteName(courseName);
  const normalizedAliases = normalizeAliases(aliases)
    .filter((alias) => alias !== normalizedCourseName);

  if (!normalizedAliases.length) {
    return normalizedCourseName;
  }

  return `${normalizedCourseName}${separator}(${normalizedAliases.join(', ')})`;
}
