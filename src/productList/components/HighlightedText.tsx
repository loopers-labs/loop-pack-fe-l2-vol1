import { splitHighlightParts } from "../utils";

/** 텍스트에서 검색어와 일치하는 부분을 <mark> 로 강조해 보여준다. */
export default function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const parts = splitHighlightParts(text, query);

  return (
    <>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark key={index} style={{ background: "#fff176", padding: 0 }}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}
