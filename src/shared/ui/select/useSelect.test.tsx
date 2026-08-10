// [AI] render/userEvent에 DOM이 필요하므로 jsdom 환경을 명시한다.
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useSelect } from './useSelect';
import type { UseSelectOptions } from './types';

// ─────────────────────────────────────────────────────────────
// 테스트용 옵션 데이터
// c 는 disabled → 키보드 이동에서 건너뛰어야 한다.
// ─────────────────────────────────────────────────────────────
type Item = { id: string; disabled?: boolean };
const ITEMS: Item[] = [
  { id: 'a' },
  { id: 'b' },
  { id: 'c', disabled: true },
  { id: 'd' },
  { id: 'e' },
  { id: 'f' },
  { id: 'g' },
  { id: 'h' },
];
const itemToKey = (item: Item) => item.id;
const isItemDisabled = (item: Item) => item.disabled === true;

// useSelect 를 렌더하는 최소한의 테스트 하네스.
// 부모가 제어 모드를 테스트할 수 있도록 options 를 props 로 받는다.
type HarnessProps = Omit<UseSelectOptions<Item>, 'items' | 'itemToKey' | 'isItemDisabled'> & {
  items?: Item[];
  maxHeight?: number;
};

const SelectHarness = ({ items = ITEMS, maxHeight, ...options }: HarnessProps) => {
  const select = useSelect<Item>({
    items,
    itemToKey,
    isItemDisabled,
    ...options,
  });
  const menuStyle: React.CSSProperties = maxHeight ? { maxHeight, overflow: 'auto' } : {};
  return (
    <div>
      <button type="button" {...select.getToggleButtonProps()} data-testid="toggle">
        {select.selectedItem ? select.selectedItem.id : 'none'}
      </button>
      {select.isOpen && (
        <ul {...select.getMenuProps()} data-testid="menu" style={menuStyle}>
          {items.map((item, index) => {
            const { isSelected, isHighlighted, ...rest } = select.getItemProps({
              item,
              index,
            });
            return (
              <li
                key={item.id}
                {...rest}
                data-selected={isSelected}
                data-highlighted={isHighlighted}
              >
                {item.id}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// 제어 모드(open) 를 부모가 소유하는 래퍼 — 외부 상태로 열고닫음을 검증.
const ControlledOpenHarness = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <SelectHarness isOpen={isOpen} onIsOpenChange={setIsOpen} />;
};

const user = userEvent.setup();

// 메뉴가 열려있는 상태로 만드는 헬퍼
const openMenu = async () => {
  await user.click(screen.getByTestId('toggle'));
};

describe('useSelect — 기본 동작', () => {
  it('초기엔 닫혀있고 토글 클릭으로 열린다', async () => {
    render(<SelectHarness />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await openMenu();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByTestId('toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  it('옵션 클릭으로 선택 → onSelectedItemChange 호출 + 메뉴 닫힘', async () => {
    const onSelectedItemChange = vi.fn();
    render(<SelectHarness onSelectedItemChange={onSelectedItemChange} />);
    await openMenu();
    await user.click(screen.getByText('b'));
    expect(onSelectedItemChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemChange).toHaveBeenCalledWith({ id: 'b' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByTestId('toggle')).toHaveTextContent('b');
  });

  it('같은 옵션을 다시 클릭하면 onSelectedItemChange 는 호출되지 않는다', async () => {
    const onSelectedItemChange = vi.fn();
    render(
      <SelectHarness initialSelectedItem={ITEMS[1]} onSelectedItemChange={onSelectedItemChange} />
    );
    await openMenu();
    await user.click(within(screen.getByRole('listbox')).getByText('b'));
    expect(onSelectedItemChange).not.toHaveBeenCalled();
  });
});

describe('useSelect — 키보드 제스처', () => {
  it('닫힌 상태에서 ArrowDown/ArrowUp 입력 시 열린다', async () => {
    render(<SelectHarness />);
    screen.getByTestId('toggle').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('선택값이 있는 상태로 열면 선택값이 하이라이트된다', async () => {
    render(<SelectHarness initialSelectedItem={ITEMS[4]} />);
    await openMenu();
    const menu = screen.getByRole('listbox');
    const highlightedId = menu.getAttribute('aria-activedescendant');
    const target = within(menu).getByText('e');
    expect(highlightedId).toBe(target.id);
  });

  it('선택값 없이 열면 첫 활성 옵션이 하이라이트된다', async () => {
    render(<SelectHarness />);
    await openMenu();
    const menu = screen.getByRole('listbox');
    expect(menu.getAttribute('aria-activedescendant')).toBe(screen.getByText('a').id);
  });

  it('ArrowDown 이동 시 disabled 옵션(c)을 건너뛴다', async () => {
    render(<SelectHarness />);
    await openMenu();
    // a(0) → ArrowDown → b(1) → ArrowDown → c(2) 건너뜀 → d(3)
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe(
      screen.getByText('b').id
    );
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe(
      screen.getByText('d').id
    );
  });

  it('Home/End 입력 시 첫/마지막 활성 옵션으로 이동', async () => {
    render(<SelectHarness />);
    await openMenu();
    await user.keyboard('{End}');
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe(
      screen.getByText('h').id
    );
    await user.keyboard('{Home}');
    expect(screen.getByRole('listbox').getAttribute('aria-activedescendant')).toBe(
      screen.getByText('a').id
    );
  });

  it('Enter 와 Space 모두 하이라이트 항목을 선택한다', async () => {
    const onSelectedItemChange = vi.fn();
    render(<SelectHarness onSelectedItemChange={onSelectedItemChange} />);
    await openMenu(); // a 하이라이트
    await user.keyboard('{ArrowDown}'); // → b 하이라이트
    await user.keyboard('{Enter}');
    expect(onSelectedItemChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemChange).toHaveBeenCalledWith({ id: 'b' });
  });

  it('Space 로도 하이라이트 항목을 선택한다', async () => {
    const onSelectedItemChange = vi.fn();
    render(<SelectHarness onSelectedItemChange={onSelectedItemChange} />);
    await openMenu(); // a
    await user.keyboard('{ArrowDown}'); // b
    await user.keyboard(' '); // Space
    expect(onSelectedItemChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemChange).toHaveBeenCalledWith({ id: 'b' });
  });

  it('Escape 로 닫고 포커스가 토글로 복귀한다', async () => {
    render(<SelectHarness />);
    await openMenu();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByTestId('toggle')).toHaveFocus();
  });
});

describe('useSelect — controlled / uncontrolled 이중 API', () => {
  it('controlled open: 부모가 상태를 소유하면 내부에서 닫아도 외부가 유지한다', async () => {
    const onIsOpenChange = vi.fn();
    const { rerender } = render(<SelectHarness isOpen={true} onIsOpenChange={onIsOpenChange} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // 외부 클릭이 아닌, 메뉴 닫기 로직(onIsOpenChange)만 호출되는지 확인
    await user.click(screen.getByText('a')); // 선택 → 닫기 시도
    expect(onIsOpenChange).toHaveBeenCalledWith(false);
    // 여전히 열려있어야 한다 (부모가 안 바꿈)
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // 부모가 false 로 바꾸면 닫힌다
    rerender(<SelectHarness isOpen={false} onIsOpenChange={onIsOpenChange} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('controlled selectedItem: 부모 값이 표시되고 클릭은 onSelectedItemChange 만 호출', async () => {
    const onSelectedItemChange = vi.fn();
    render(<SelectHarness selectedItem={ITEMS[0]} onSelectedItemChange={onSelectedItemChange} />);
    expect(screen.getByTestId('toggle')).toHaveTextContent('a');
    await openMenu();
    await user.click(screen.getByText('b'));
    expect(onSelectedItemChange).toHaveBeenCalledTimes(1);
    expect(onSelectedItemChange).toHaveBeenCalledWith({ id: 'b' });
    // 제어값은 여전히 a (내부 상태 미변경)
    expect(screen.getByTestId('toggle')).toHaveTextContent('a');
  });

  it('ControlledOpenHarness: 외부 상태로 열고닫기가 정상 동작', async () => {
    render(<ControlledOpenHarness />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByTestId('toggle'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('useSelect — 스크롤 보정', () => {
  it('하이라이트가 가시 영역 아래로 벗어나면 scrollTop 을 아래로 보정한다', async () => {
    render(<SelectHarness maxHeight={100} />);
    await openMenu();

    const menu = screen.getByTestId('menu');
    const options = within(menu).getAllByRole('option');

    // 메뉴 뷰포트: top 0 / bottom 100
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 100));
    // 마지막 옵션(h): top 160 / bottom 200 → 뷰포트 밖(아래)
    const last = options[options.length - 1];
    vi.spyOn(last, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 160, 200, 40));

    await user.keyboard('{End}'); // h 로 하이라이트 이동 → 레이아웃 이펙트가 보정
    expect(menu.scrollTop).toBe(100); // 200(bottom) - 100(뷰포트 bottom)
  });

  it('하이라이트가 가시 영역 위로 벗어나면 scrollTop 을 위로 보정한다', async () => {
    render(<SelectHarness maxHeight={100} />);
    await openMenu();
    await user.keyboard('{End}'); // h 로 이동(보정 없이 조작만)

    const menu = screen.getByTestId('menu');
    const options = within(menu).getAllByRole('option');

    // 이미 scrollTop 이 있다고 가정하고, 첫 옵션(a)이 위로 삐져나간 상황 묘사
    menu.scrollTop = 50;
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 100));
    const first = options[0];
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, -40, 200, 40));

    await user.keyboard('{Home}'); // a 로 이동 → 위로 보정
    expect(menu.scrollTop).toBe(10); // 50 - (0 - (-40)) = 10
  });
});

// 각 테스트 후 DOM 정리 (vitest globals 환경에서 자동 cleanup 보장용)
afterEach(() => {
  cleanup();
});
