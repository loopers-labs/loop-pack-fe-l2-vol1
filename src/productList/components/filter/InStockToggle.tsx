/** 재고 있는 상품만 보기 체크박스. */
export default function InStockToggle({
  inStockOnly,
  onInStockToggle,
}: {
  inStockOnly: boolean;
  onInStockToggle: (next: boolean) => void;
}) {
  return (
    <div className="filter-group">
      <label>옵션</label>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 400,
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onInStockToggle(e.target.checked)}
        />
        재고 있는 것만
      </label>
    </div>
  );
}
