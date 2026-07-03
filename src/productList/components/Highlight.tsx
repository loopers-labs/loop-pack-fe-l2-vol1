// [AI 생성] 3주차 관심사 분리 — 검색어 하이라이트 표시 컴포넌트 (검토·수정)
type HighlightProps = {
  text: string;
  query: string;
};

// 텍스트 안에서 검색어와 일치하는 부분만 <mark>로 감싼다.
export function Highlight({ text, query }: HighlightProps) {
  if (!query) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: "#fff176", padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
