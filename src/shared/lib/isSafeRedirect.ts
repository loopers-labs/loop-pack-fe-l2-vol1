export function isSafeRedirect(next: string, requestOrigin: string): boolean {
  try {
    return new URL(next, requestOrigin).origin === requestOrigin;
  } catch {
    return false;
  }
}
