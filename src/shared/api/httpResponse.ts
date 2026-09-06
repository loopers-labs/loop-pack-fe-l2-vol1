export async function readHttpBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export function getHttpErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return fallback;
}
