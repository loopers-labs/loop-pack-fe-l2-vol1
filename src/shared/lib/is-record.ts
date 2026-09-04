// localStorage 저장값처럼 unknown으로 들어온 값에서 타입 단언 없이 키를 읽기 위한 가드.
// 배열은 제외한다. typeof는 배열도 'object'로 보고하지만, 키·값 쌍으로 다룰 대상이 아니다.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
