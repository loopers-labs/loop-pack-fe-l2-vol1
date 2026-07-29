export type IdSet = Record<string, true>;

export function normalizeIdSet(value: unknown): IdSet {
  if (!isObjectRecord(value)) {
    return {};
  }

  const idSet: IdSet = {};

  Object.entries(value).forEach(([key, included]) => {
    if (key.trim().length > 0 && included === true) {
      idSet[key] = true;
    }
  });

  return idSet;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
