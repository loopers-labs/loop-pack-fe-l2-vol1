/**
 * 검색어를 정규식에 안전하게 넣기 위한 escape
 * - 분리 기준: 단순 정규식 변환이라 순수 함수로 분리하였습니다.
 */
export const escapeSearchRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
