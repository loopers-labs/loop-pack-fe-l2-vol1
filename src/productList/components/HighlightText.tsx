import { escapeSearchRegExp } from '../utils/escapeSearchRegExp';

interface HighlightTextProps {
  text: string;
  query: string;
}

/**
 * 검색어와 일치하는 부분을 하이라이팅하는 컴포넌트
 * - 분리 기준: 그리드 렌더 루프 안에 인라인 함수로 정의되어 매 아이템마다 재생성되고 있어 분리하였습니다.
 */
const HighlightText = ({ text, query }: HighlightTextProps) => {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeSearchRegExp(query)})`, 'gi'));

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
};

export default HighlightText;
