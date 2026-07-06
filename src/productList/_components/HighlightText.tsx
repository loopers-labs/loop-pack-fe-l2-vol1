// 검색어와 일치하는 텍스트를 <mark>로 강조해 반환하는 표시 전용 컴포넌트

type Props = {
  text: string;
  query: string;
};

export function HighlightText({ text, query }: Props) {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: '#fff176', padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
