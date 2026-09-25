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

function collectDirectCanonicalNames(directPrerequisiteData) {
  return new Set(
    Object.keys(directPrerequisiteData?.prerequisiteCourses || {})
      .map(normalizePrerequisiteName)
      .filter(Boolean)
  );
}

function collectAliasTargets(sources, directCanonicalNames) {
  const aliasTargets = new Map();

  for (const source of sources) {
    const courseAliases = source?.courseAliases;

    if (!courseAliases || typeof courseAliases !== 'object') {
      continue;
    }

    for (const [rawCanonicalName, rawAliases] of Object.entries(courseAliases)) {
      const canonicalName = normalizePrerequisiteName(rawCanonicalName);

      if (!canonicalName) {
        continue;
      }

      for (const alias of normalizeAliases(rawAliases)) {
        if (!alias || alias === canonicalName) {
          continue;
        }

        // If Direct explicitly lists the alias as its own prerequisite course,
        // do not reinterpret it as another course.
        if (
          directCanonicalNames.has(alias) &&
          alias !== canonicalName
        ) {
          continue;
        }

        if (!aliasTargets.has(alias)) {
          aliasTargets.set(alias, new Set());
        }

        aliasTargets.get(alias).add(canonicalName);
      }
    }
  }

  return aliasTargets;
}

function resolveCanonicalName(courseName, directCanonicalNames, aliasTargets) {
  if (directCanonicalNames.has(courseName)) {
    return courseName;
  }

  const targets = aliasTargets.get(courseName);

  if (!targets || targets.size !== 1) {
    return courseName;
  }

  return Array.from(targets)[0];
}

export function mergePrerequisiteData(
  directPrerequisiteData,
  indirectPrerequisiteData
) {
  const sources = [directPrerequisiteData, indirectPrerequisiteData];
  const directCanonicalNames =
    collectDirectCanonicalNames(directPrerequisiteData);
  const aliasTargets =
    collectAliasTargets(sources, directCanonicalNames);

  const mergedCourses = new Map();
  const mergedAliases = new Map();

  for (const source of sources) {
    const prerequisiteCourses = source?.prerequisiteCourses;

    if (!prerequisiteCourses || typeof prerequisiteCourses !== 'object') {
      continue;
    }

    for (const [rawCourseName, rawStudentIds] of Object.entries(prerequisiteCourses)) {
      const courseName = normalizePrerequisiteName(rawCourseName);

      if (!courseName) {
        continue;
      }

      const canonicalName = resolveCanonicalName(
        courseName,
        directCanonicalNames,
        aliasTargets
      );

      if (!mergedCourses.has(canonicalName)) {
        mergedCourses.set(canonicalName, new Set());
      }

      if (!Array.isArray(rawStudentIds)) {
        continue;
      }

      const studentIds = mergedCourses.get(canonicalName);

      for (const rawStudentId of rawStudentIds) {
        const studentId = normalizeStudentId(rawStudentId);

        if (studentId) {
          studentIds.add(studentId);
        }
      }
    }
  }

  for (const source of sources) {
    const courseAliases = source?.courseAliases;

    if (!courseAliases || typeof courseAliases !== 'object') {
      continue;
    }

    for (const [rawCanonicalName, rawAliases] of Object.entries(courseAliases)) {
      const sourceCanonicalName = normalizePrerequisiteName(rawCanonicalName);

      if (!sourceCanonicalName) {
        continue;
      }

      const canonicalName = resolveCanonicalName(
        sourceCanonicalName,
        directCanonicalNames,
        aliasTargets
      );

      if (!mergedCourses.has(canonicalName)) {
        continue;
      }

      if (!mergedAliases.has(canonicalName)) {
        mergedAliases.set(canonicalName, new Set());
      }

      const aliases = mergedAliases.get(canonicalName);

      for (const alias of normalizeAliases(rawAliases)) {
        if (
          alias &&
          alias !== canonicalName &&
          !(
            directCanonicalNames.has(alias) &&
            alias !== canonicalName
          )
        ) {
          aliases.add(alias);
        }
      }
    }
  }

  return {
    prerequisiteCourses: Object.fromEntries(
      Array.from(mergedCourses, ([courseName, studentIds]) => [
        courseName,
        Array.from(studentIds),
      ])
    ),
    courseAliases: Object.fromEntries(
      Array.from(mergedAliases, ([courseName, aliases]) => [
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
