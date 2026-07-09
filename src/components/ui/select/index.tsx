// Select (Headless) — 4주차 1단계
//
// 여기에 직접 만든다. 인터페이스(로직을 어떻게 노출할지)는 스스로 설계한다.
// 요구사항 요약 (자세한 건 docs/assignments/week-04.md):
//   - 라이브러리/네이티브 <select> 없이 <div>/<ul> listbox로 직접 구현
//   - value는 문자열이 아니라 옵션 "객체 전체"
//   - 같은 로직으로 옵션 UI 3종(텍스트/썸네일/사이즈)을 렌더
//   - 키보드로 열기·이동(↑↓)·선택(Enter)·닫기(Esc)
//   - 품절 옵션은 키보드 이동에서 건너뛴다
//   - 각 옵션의 selected / highlight / disabled 를 사용처가 알 수 있게 노출
//
// 아래는 import가 깨지지 않게 둔 placeholder다. 자유롭게 갈아엎어도 된다.
"use client";
import { useState } from "react";

export function Select({
  products,
}: {
  products: { id: string; name: string; sizes: { value: number; stock: number }[] }[];
}) {
  const options = products.map((product) => ({
    ...product,
    disabled: product.sizes.every((size) => size.stock === 0),
  }));
  const select = useSelect(options);
  return (
    <div onKeyDown={select.onKeyDown}>
      <button onClick={select.toggle}>뭐고</button>
      {select.open && (
        <ul>
          {select.items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useSelect<T extends { id: string; name: string; disabled?: boolean }>(items: T[]) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);
  const [highlight, setHighlight] = useState(-1);

  const select = (item: T) => {
    if (item.disabled) return;
    setSelected(item);
    setOpen(false);
  };

  const findEnabled = (from: number, dir: 1 | -1): number => {
    let next = from + dir;
    while (next >= 0 && next < items.length) {
      if (!items[next].disabled) return next;
      next += dir;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setHighlight((i) => findEnabled(i, 1));
    if (e.key === "ArrowUp") setHighlight((i) => findEnabled(i, -1));
    if (e.key === "Enter" && highlight >= 0) select(items[highlight]);
    if (e.key === "Escape") setOpen(false);
  };

  return {
    open,
    selected,
    highlight,
    items,
    toggle: () => setOpen((o) => !o),
    select,
    onKeyDown,
  };
}
