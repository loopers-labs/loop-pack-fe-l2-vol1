import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useSelect } from '@/components/ui/select/useSelect';

type Option = { id: string; label: string; stock: number };

// 데모와 같은 패턴: stock 0 = disabled. enabled는 24·26·28
const defaultItems: Option[] = [
  { id: 'size-23', label: '23', stock: 0 },
  { id: 'size-24', label: '24', stock: 5 },
  { id: 'size-25', label: '25', stock: 0 },
  { id: 'size-26', label: '26', stock: 2 },
  { id: 'size-27', label: '27', stock: 0 },
  { id: 'size-28', label: '28', stock: 4 },
];

type TestSelectProps = {
  items?: Option[];
  selectedItem?: Option | null;
  defaultSelectedItem?: Option | null;
  onSelectedItemChange?: (changes: { selectedItem: Option | null }) => void;
};

// downshift 테스트처럼 hook을 최소 마크업에 연결한 하네스.
// getItemState 반환값은 data-*로 노출해 "사용처가 상태를 알 수 있는가"를 함께 검증한다.
function TestSelect({ items = defaultItems, ...rest }: TestSelectProps) {
  const select = useSelect({
    items,
    itemToKey: (item) => item.id,
    isItemDisabled: (item) => item.stock === 0,
    ...rest,
  });

  return (
    <div>
      <button type="button" {...select.getToggleButtonProps()}>
        {select.selectedItem?.label ?? '옵션 선택'}
      </button>
      {select.isOpen && (
        <ul {...select.getMenuProps()}>
          {items.map((item, index) => {
            const state = select.getItemState({ item, index });

            return (
              <li
                key={item.id}
                {...select.getItemProps({ item, index })}
                data-selected={state.selected}
                data-highlighted={state.highlighted}
                data-disabled={state.disabled}
              >
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function getToggle() {
  return screen.getByRole('button', { name: /옵션 선택|2\d/ });
}

function queryMenu() {
  return screen.queryByRole('listbox');
}

function getOption(label: string) {
  return screen.getByRole('option', { name: label });
}

function getHighlightedLabel() {
  const activeId = getToggle().getAttribute('aria-activedescendant');

  if (!activeId) {
    return null;
  }

  return document.getElementById(activeId)?.textContent ?? null;
}

describe('열기/닫기', () => {
  it('처음에는 닫혀 있다', () => {
    render(<TestSelect />);

    expect(queryMenu()).not.toBeInTheDocument();
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('토글을 클릭하면 열리고, 다시 클릭하면 닫힌다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    await user.click(getToggle());
    expect(queryMenu()).toBeInTheDocument();
    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');

    await user.click(getToggle());
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('닫힌 상태에서 Enter를 누르면 메뉴가 열린다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{Enter}');

    expect(queryMenu()).toBeInTheDocument();
    expect(getHighlightedLabel()).toBe('24');
  });

  it('닫힌 상태에서 Home/End는 메뉴를 열지 않는다 (페이지 스크롤을 뺏지 않는다)', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{Home}');
    expect(queryMenu()).not.toBeInTheDocument();

    await user.keyboard('{End}');
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('메뉴 바깥을 누르면 닫힌다', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <TestSelect />
        <button type="button">바깥 버튼</button>
      </div>,
    );

    await user.click(getToggle());
    await user.click(screen.getByRole('button', { name: '바깥 버튼' }));

    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('Escape로 닫히고, 이미 닫힌 상태의 Escape는 아무 일도 하지 않는다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    await user.click(getToggle());
    await user.keyboard('{Escape}');
    expect(queryMenu()).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('Tab은 메뉴를 닫고 다음 focusable 요소로 이동한다', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <TestSelect />
        <button type="button">다음 버튼</button>
      </div>,
    );

    await user.click(getToggle());
    await user.tab();

    expect(queryMenu()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 버튼' })).toHaveFocus();
  });
});

describe('키보드 하이라이트', () => {
  it('닫힌 상태에서 ArrowDown을 누르면 열리고 첫 번째 enabled 옵션이 하이라이트된다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    expect(queryMenu()).toBeInTheDocument();
    expect(getHighlightedLabel()).toBe('24'); // 23은 disabled라 건너뜀
  });

  it('닫힌 상태에서 ArrowUp을 눌러도 열리고, 시작 하이라이트는 ArrowDown과 같다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowUp}');

    expect(queryMenu()).toBeInTheDocument();
    // downshift는 ArrowUp이면 마지막 옵션을 하이라이트하지만, 우리는 여는 방향과 무관하게 같은 시작 규칙을 쓴다
    expect(getHighlightedLabel()).toBe('24');
  });

  it('양끝이 disabled면 Home/End는 안쪽의 첫/마지막 enabled로 간다', async () => {
    const user = userEvent.setup();
    const edgeDisabledItems: Option[] = [
      { id: 'edge-1', label: '앞품절', stock: 0 },
      { id: 'edge-2', label: 'A', stock: 1 },
      { id: 'edge-3', label: 'B', stock: 1 },
      { id: 'edge-4', label: '뒤품절', stock: 0 },
    ];

    render(<TestSelect items={edgeDisabledItems} />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    await user.keyboard('{End}');
    expect(getHighlightedLabel()).toBe('B');

    await user.keyboard('{Home}');
    expect(getHighlightedLabel()).toBe('A');
  });

  it('선택값이 있는 상태로 열면 선택값이 하이라이트된다', async () => {
    const user = userEvent.setup();

    render(<TestSelect defaultSelectedItem={defaultItems[3]} />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    expect(getHighlightedLabel()).toBe('26');
  });

  it('ArrowDown/ArrowUp 이동은 disabled 옵션을 건너뛴다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}'); // 열림, 24
    await user.keyboard('{ArrowDown}'); // 25 건너뛰고 26
    expect(getHighlightedLabel()).toBe('26');

    await user.keyboard('{ArrowUp}'); // 다시 24
    expect(getHighlightedLabel()).toBe('24');
  });

  it('첫/마지막 옵션에서는 더 이동하지 않는다 (wrap 없이 멈춤)', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}'); // 열림, 첫 enabled 24
    await user.keyboard('{ArrowUp}');
    expect(getHighlightedLabel()).toBe('24');

    await user.keyboard('{End}'); // 마지막 enabled 28
    await user.keyboard('{ArrowDown}');
    expect(getHighlightedLabel()).toBe('28');
  });

  it('Home/End는 첫/마지막 enabled 옵션으로 이동한다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    await user.keyboard('{End}');
    expect(getHighlightedLabel()).toBe('28');

    await user.keyboard('{Home}');
    expect(getHighlightedLabel()).toBe('24');
  });

  it('itemToKey가 같으면 items 안 객체와 다른 reference도 같은 선택값으로 인식한다', async () => {
    const user = userEvent.setup();

    render(
      <TestSelect
        defaultSelectedItem={{ id: 'size-26', label: '26', stock: 2 }}
      />,
    );

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    expect(getHighlightedLabel()).toBe('26');
    expect(getOption('26')).toHaveAttribute('data-selected', 'true');
  });

  it('선택값이 disabled면 열 때 첫 번째 enabled 옵션이 하이라이트된다', async () => {
    const user = userEvent.setup();

    render(<TestSelect defaultSelectedItem={defaultItems[0]} />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');

    expect(getHighlightedLabel()).toBe('24');
  });

  it('닫았다 다시 열면 하이라이트는 잔상 없이 선택값 기준으로 초기화된다', async () => {
    const user = userEvent.setup();

    render(<TestSelect defaultSelectedItem={defaultItems[3]} />);

    await user.click(getToggle());
    await user.hover(getOption('28'));
    expect(getHighlightedLabel()).toBe('28');

    await user.keyboard('{Escape}');
    await user.keyboard('{ArrowDown}'); // 다시 열기

    expect(getHighlightedLabel()).toBe('26');
  });

  it('마우스를 올리면 하이라이트가 이동하고, disabled 옵션에는 반응하지 않는다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    await user.click(getToggle());

    await user.hover(getOption('28'));
    expect(getHighlightedLabel()).toBe('28');

    await user.hover(getOption('25'));
    expect(getHighlightedLabel()).toBe('28');
  });
});

describe('선택', () => {
  it('옵션을 클릭하면 옵션 객체 전체로 onSelectedItemChange가 호출되고 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(<TestSelect onSelectedItemChange={onSelectedItemChange} />);

    await user.click(getToggle());
    await user.click(getOption('26'));

    expect(onSelectedItemChange).toHaveBeenCalledWith({
      selectedItem: defaultItems[3],
    });
    expect(getToggle()).toHaveTextContent('26');
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('Enter를 누르면 하이라이트된 옵션이 선택되고 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}'); // 열림, 24
    await user.keyboard('{ArrowDown}'); // 26
    await user.keyboard('{Enter}');

    expect(getToggle()).toHaveTextContent('26');
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('Space를 누르면 하이라이트된 옵션이 선택되고 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}'); // 열림, 24
    await user.keyboard('{ArrowDown}'); // 26
    await user.keyboard(' ');

    expect(getToggle()).toHaveTextContent('26');
    expect(queryMenu()).not.toBeInTheDocument();
  });

  it('선택을 확정하기 전에는(열기·이동·닫기) onSelectedItemChange가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(<TestSelect onSelectedItemChange={onSelectedItemChange} />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{End}');
    await user.keyboard('{Escape}');

    expect(onSelectedItemChange).not.toHaveBeenCalled();
  });

  it('controlled 상태에서도 선택 시 onSelectedItemChange는 호출되고 표시값은 prop을 따른다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(
      <TestSelect
        selectedItem={defaultItems[1]}
        onSelectedItemChange={onSelectedItemChange}
      />,
    );

    await user.click(getToggle());
    await user.click(getOption('26'));

    expect(onSelectedItemChange).toHaveBeenCalledWith({
      selectedItem: defaultItems[3],
    });
    expect(getToggle()).toHaveTextContent('24');
  });

  it('controlled: selectedItem이 null이면 내부 선택값으로 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(
      <TestSelect
        selectedItem={null}
        onSelectedItemChange={onSelectedItemChange}
      />,
    );

    await user.click(getToggle());
    await user.click(getOption('26'));

    expect(onSelectedItemChange).toHaveBeenCalledWith({
      selectedItem: defaultItems[3],
    });
    expect(getToggle()).toHaveTextContent('옵션 선택');
  });

  it('이미 선택된 항목을 다시 선택하면 onSelectedItemChange가 호출되지 않고 메뉴만 닫힌다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(
      <TestSelect
        defaultSelectedItem={defaultItems[3]}
        onSelectedItemChange={onSelectedItemChange}
      />,
    );

    await user.click(getToggle());
    await user.click(getOption('26'));

    expect(onSelectedItemChange).not.toHaveBeenCalled();
    expect(queryMenu()).not.toBeInTheDocument();
    expect(getToggle()).toHaveTextContent('26');
  });

  it('defaultSelectedItem은 초기값으로만 쓰이고 이후 변경은 무시된다', () => {
    const { rerender } = render(
      <TestSelect defaultSelectedItem={defaultItems[1]} />,
    );
    expect(getToggle()).toHaveTextContent('24');

    rerender(<TestSelect defaultSelectedItem={defaultItems[3]} />);
    expect(getToggle()).toHaveTextContent('24');
  });

  it('disabled 옵션은 클릭해도 선택되지 않고 메뉴도 닫히지 않는다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();

    render(<TestSelect onSelectedItemChange={onSelectedItemChange} />);

    await user.click(getToggle());
    await user.click(getOption('25'));

    expect(onSelectedItemChange).not.toHaveBeenCalled();
    expect(queryMenu()).toBeInTheDocument();
  });

  it('controlled: selectedItem prop이 단일 출처가 되고, 외부에서 값을 바꾸면 따라간다', async () => {
    const user = userEvent.setup();

    function ControlledSelect() {
      return <TestSelect selectedItem={defaultItems[1]} />;
    }

    const { rerender } = render(<ControlledSelect />);
    expect(getToggle()).toHaveTextContent('24');

    // 내부에서 선택해도 controlled라 외부 값(24)이 유지된다
    await user.click(getToggle());
    await user.click(getOption('26'));
    expect(getToggle()).toHaveTextContent('24');

    rerender(<TestSelect selectedItem={defaultItems[3]} />);
    expect(getToggle()).toHaveTextContent('26');
  });
});

describe('엣지 케이스', () => {
  it('items가 빈 배열이면 열어도 옵션이 없고 하이라이트도 없다', async () => {
    const user = userEvent.setup();

    render(<TestSelect items={[]} />);

    await user.click(getToggle());

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(getHighlightedLabel()).toBeNull();
  });

  it('모든 옵션이 disabled면 하이라이트 대상이 생기지 않고 Enter도 아무 일을 하지 않는다', async () => {
    const user = userEvent.setup();
    const onSelectedItemChange = vi.fn();
    const allDisabled = defaultItems.map((item) => ({ ...item, stock: 0 }));

    render(
      <TestSelect
        items={allDisabled}
        onSelectedItemChange={onSelectedItemChange}
      />,
    );

    getToggle().focus();
    await user.keyboard('{ArrowDown}');
    expect(getHighlightedLabel()).toBeNull();

    await user.keyboard('{Enter}');
    expect(onSelectedItemChange).not.toHaveBeenCalled();
  });
});

describe('사용처에 노출되는 상태', () => {
  it('getItemState로 각 옵션의 selected/highlighted/disabled를 알 수 있다', async () => {
    const user = userEvent.setup();

    render(<TestSelect defaultSelectedItem={defaultItems[1]} />);

    getToggle().focus();
    await user.keyboard('{ArrowDown}'); // 열림, 선택값 24가 하이라이트

    expect(getOption('24')).toHaveAttribute('data-selected', 'true');
    expect(getOption('24')).toHaveAttribute('data-highlighted', 'true');
    expect(getOption('25')).toHaveAttribute('data-disabled', 'true');
    expect(getOption('26')).toHaveAttribute('data-selected', 'false');
  });

  it('접근성 계약: listbox/option role과 aria-selected/aria-disabled가 내려간다', async () => {
    const user = userEvent.setup();

    render(<TestSelect defaultSelectedItem={defaultItems[1]} />);

    await user.click(getToggle());

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(getOption('24')).toHaveAttribute('aria-selected', 'true');
    expect(getOption('25')).toHaveAttribute('aria-disabled', 'true');
  });

  it('접근성 계약: toggle의 aria-controls가 listbox의 id를 가리킨다', async () => {
    const user = userEvent.setup();

    render(<TestSelect />);

    await user.click(getToggle());

    expect(screen.getByRole('listbox').id).toBe(
      getToggle().getAttribute('aria-controls'),
    );
  });
});
