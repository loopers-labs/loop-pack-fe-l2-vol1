export function ProductFilters() {
  return (
    <form className="flex flex-wrap items-center gap-3">
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        검색
        <input
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="q"
          placeholder="상품명 또는 브랜드"
        />
      </label>
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        카테고리
        <select
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="category"
          defaultValue="all"
        >
          <option value="all">전체</option>
          <option value="casual">캐주얼</option>
          <option value="fashion">패션</option>
          <option value="goods">뷰티·잡화</option>
          <option value="home">홈</option>
          <option value="digital">디지털</option>
        </select>
      </label>
      <label className="grid gap-1.5 max-md:flex-[1_1_100%]">
        정렬
        <select
          className="min-h-10 border border-[#c8c8c8] bg-transparent px-2.5 py-2 text-inherit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#2557a7]"
          name="sort"
          defaultValue="latest"
        >
          <option value="latest">최신순</option>
        </select>
      </label>
    </form>
  );
}
