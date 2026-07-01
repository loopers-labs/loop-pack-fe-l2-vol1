import { escapeRegExp } from '../../utils/escapeRegExp';

export const HighlightMatch = ({ text, searchQuery }: { text: string; searchQuery: string }) => {
  if (!searchQuery) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} style={{ background: '#fff176', padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};
