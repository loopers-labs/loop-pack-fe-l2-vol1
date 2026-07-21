/**
 * 공용 API Client
 * fetch는 4xx/5xx에서 에러를 던지지 않으므로 response.ok를 검사해 throw한다.
 * 에러 화면에 그대로 노출되므로 구현 메시지가 아니라 사용자용 문구만 던진다.
 */
export async function apiClient<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path);
  } catch {
    throw new Error(
      '네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
  }

  // 성공이든 실패든 본문에서 값을 꺼내므로 한 번만 파싱하고, 파싱 실패는 null로 둔다.
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiMessage = (body as { message?: string } | null)?.message;

    throw new Error(
      apiMessage ?? `요청에 실패했습니다. (HTTP ${response.status})`,
    );
  }

  if (body === null) {
    throw new Error('응답을 처리하지 못했습니다.');
  }

  return body as T;
}
