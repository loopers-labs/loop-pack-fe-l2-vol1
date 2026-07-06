export function readNumberListFromStorage(key: string): number[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is number => Number.isFinite(value));
  } catch {
    return [];
  }
}

export function writeNumberListToStorage(key: string, value: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}
