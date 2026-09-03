export function normalizeLoginRedirectPath(value: string | null | undefined) {
  const path = value?.trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}
