export function issue(code, path, message) {
  return { code, path, message };
}

export function validationResult(errors) {
  return { ok: errors.length === 0, errors };
}

export function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function hasOnlyKeys(value, allowed, path, errors) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors.push(issue("unknown-key", `${path}.${key}`, "허용되지 않은 필드입니다."));
    }
  }
}

export function requireKeys(value, required, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(issue("type", path, "객체여야 합니다."));
    return false;
  }
  for (const key of required) {
    if (!(key in value)) {
      errors.push(issue("required", `${path}.${key}`, "필수 필드입니다."));
    }
  }
  return true;
}

export function stableUniqueStrings(value, path, errors, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(issue("type", path, "문자열 배열이어야 합니다."));
    return [];
  }
  const seen = new Set();
  const result = [];
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      errors.push(issue("type", `${path}[${index}]`, "비어 있지 않은 문자열이어야 합니다."));
      return;
    }
    if (seen.has(entry)) {
      errors.push(issue("duplicate", `${path}[${index}]`, `중복 값 ${entry}입니다.`));
      return;
    }
    seen.add(entry);
    result.push(entry);
  });
  if (nonEmpty && result.length === 0) {
    errors.push(issue("min-items", path, "한 개 이상의 값이 필요합니다."));
  }
  return result;
}

export function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  const left = [...actual].sort();
  const right = [...expected].sort();
  return left.every((value, index) => value === right[index]);
}
