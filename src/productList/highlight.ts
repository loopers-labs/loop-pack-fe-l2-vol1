export type TextSegment = {
  text: string;
  isMatch: boolean;
};

// 검색어를 정규식에 안전하게 넣기 위한 escape (특수문자로 인한 RegExp 크래시 방지)
export const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * text를 query(대소문자 무시) 기준으로 매치/비매치 세그먼트로 나눈다.
 * query가 비어있으면 전체 텍스트를 하나의 non-match 세그먼트로 반환한다.
 */
export function splitByMatch(text: string, query: string): TextSegment[] {
  if (!query) return [{ text, isMatch: false }];
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  const lowerQuery = query.toLowerCase();
  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === lowerQuery,
  }));
}
