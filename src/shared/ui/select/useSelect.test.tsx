// @vitest-environment jsdom

import '@/test/setupDom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useSelect } from '.';
import type { SelectOption } from '.';

type Fruit = { id: string; name: string };

const FRUITS: SelectOption<Fruit>[] = [
  { value: { id: 'apple', name: '사과' } },
  { value: { id: 'banana', name: '바나나' } },
  { value: { id: 'cherry', name: '체리' }, isDisabled: true },
  { value: { id: 'durian', name: '두리안' } },
];

const ALL_DISABLED: SelectOption<Fruit>[] = [
  { value: { id: 'a', name: 'A' }, isDisabled: true },
  { value: { id: 'b', name: 'B' }, isDisabled: true },
];

function TestSelect({ options = FRUITS }: { options?: SelectOption<Fruit>[] }) {
  const {
    isOpen,
    highlightedIndex,
    selectedOption,
    containerRef,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  } = useSelect({ options });

  return (
    <div ref={containerRef}>
      <button {...getToggleButtonProps()}>
        {selectedOption ? selectedOption.value.name : '선택하세요'}
      </button>
      <ul {...getMenuProps()}>
        {isOpen &&
          options.map((option, index) => (
            <li
              key={option.value.id}
              {...getItemProps({ item: option, index })}
            >
              {option.value.name}
              {index === highlightedIndex && ' (highlighted)'}
            </li>
          ))}
      </ul>
    </div>
  );
}

describe('useSelect', () => {
  it('클릭으로 열고 일반 옵션을 선택하며 disabled 옵션은 선택하지 않는다', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);
    const toggle = screen.getByRole('combobox');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /체리/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await user.click(screen.getByRole('option', { name: /체리/ }));
    expect(toggle).toHaveTextContent('선택하세요');

    await user.click(screen.getByRole('option', { name: /바나나/ }));
    expect(toggle).toHaveTextContent('바나나');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('방향키로 disabled 옵션을 건너뛰고 순환한 뒤 Enter로 선택한다', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);
    const toggle = screen.getByRole('combobox');

    toggle.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /사과/ })).toHaveTextContent(
      '(highlighted)',
    );

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: /두리안/ })).toHaveTextContent(
      '(highlighted)',
    );

    await user.keyboard('{ArrowDown}{ArrowUp}{Enter}');
    expect(toggle).toHaveTextContent('두리안');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('Enter와 Space로 열고 Escape로 닫는다', async () => {
    const user = userEvent.setup();
    render(<TestSelect />);
    const toggle = screen.getByRole('combobox');

    toggle.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('option', { name: /사과/ })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    await user.keyboard(' ');
    expect(screen.getByRole('option', { name: /사과/ })).toBeInTheDocument();
  });

  it('외부 영역을 클릭하면 닫힌다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TestSelect />
        <button type="button">외부 영역</button>
      </>,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('button', { name: '외부 영역' }));

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('모든 옵션이 disabled면 열린 뒤에도 선택 대상을 만들지 않는다', () => {
    const { result } = renderHook(() => useSelect({ options: ALL_DISABLED }));

    act(() => {
      result.current.getToggleButtonProps().onClick();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.highlightedIndex).toBe(-1);
  });

  it('controlled 모드에서는 선택을 직접 바꾸지 않고 변경을 알린다', () => {
    const handleChange = vi.fn();
    const { result } = renderHook(() =>
      useSelect({
        options: FRUITS,
        selectedOption: FRUITS[0],
        onSelectedOptionChange: handleChange,
      }),
    );

    act(() => {
      result.current.getItemProps({ item: FRUITS[1], index: 1 }).onClick();
    });

    expect(handleChange).toHaveBeenCalledWith(FRUITS[1]);
    expect(result.current.selectedOption).toBe(FRUITS[0]);
  });
});
