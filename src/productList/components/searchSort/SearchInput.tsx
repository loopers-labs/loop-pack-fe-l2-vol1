/** 상품명 검색어 입력. */
export default function SearchInput({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <input
      type="search"
      placeholder="상품 검색..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="search-input"
    />
  );
}
