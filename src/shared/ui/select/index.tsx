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

export type SelectOption = { id: string; name: string; disabled?: boolean };
export type OptionState = { selected: boolean; highlighted: boolean; disabled: boolean };

// 제네릭 shell: 리스트박스의 "동작"만 담당하고, 옵션 생김새는 renderOption에 위임.
// 같은 shell + 같은 useSelect로 서로 다른 옵션 UI 3종을 전부 그린다(headless의 핵심).
export function Select<T extends SelectOption>({
  options,
  placeholder,
  renderOption,
}: {
  options: T[];
  placeholder: string;
  renderOption: (item: T, state: OptionState) => React.ReactNode;
}) {
  const select = useSelect(options);
  return (
    <div onKeyDown={select.onKeyDown}>
      <button type="button" onClick={select.toggle}>
        {select.selected ? select.selected.name : placeholder}
      </button>
      {select.open && (
        <ul role="listbox">
          {select.items.map((item, index) => {
            const state = select.getOptionState(item, index);
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={state.selected}
                aria-disabled={state.disabled}
                onClick={() => select.select(item)}
                style={{
                  // shell은 "동작 피드백"만 칠한다: 키보드 하이라이트 + 품절 잠금.
                  // "선택됨"을 어떻게 보일지는 사용처(renderOption)가 state로 판단.
                  background: state.highlighted ? "#e5edff" : "transparent",
                  opacity: state.disabled ? 0.4 : 1,
                  cursor: state.disabled ? "not-allowed" : "pointer",
                }}
              >
                {renderOption(item, state)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function useSelect<T extends SelectOption>(items: T[]) {
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

  // 옵션별 상태를 "사용처가 물어보게" 노출(B안). 훅은 생김새를 모르고
  // "이 옵션이 지금 선택/하이라이트/비활성인가"만 답한다. raw highlight 인덱스는
  // 감춰서, 사용처가 인덱스 계산에 얽히지 않고 스타일 판단만 하게 한다.
  const getOptionState = (item: T, index: number) => ({
    selected: selected?.id === item.id,
    highlighted: highlight === index,
    disabled: item.disabled ?? false,
  });

  return {
    open,
    selected,
    items,
    toggle: () => setOpen((o) => !o),
    select,
    onKeyDown,
    getOptionState,
  };
}
