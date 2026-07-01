// text에서 highlightWord와 일치하는 부분을 <mark>로 강조하는 순수 UI 컴포넌트.
export function HighlightText({
  text,
  highlightWord,
}: {
  text: string;
  highlightWord: string;
}) {
  if (!highlightWord) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlightWord})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlightWord.toLowerCase() ? (
          <mark key={i} className="highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
