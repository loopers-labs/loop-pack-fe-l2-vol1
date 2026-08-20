// @vitest-environment jsdom

import '@/test/setupDom';
import { describe, it, expect } from 'vitest';
import { renderHook, act , render, screen } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { useSelect } from '.';
import type { SelectOption } from '.';

// ── 테스트 헬퍼 ──

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
      <button {...getToggleButtonProps()} data-testid="toggle">
        {selectedOption ? selectedOption.value.name : '선택하세요'}
      </button>
      <ul {...getMenuProps()} data-testid="menu">
        {isOpen &&
          options.map((option, index) => (
            <li
              key={option.value.id}
              {...getItemProps({ item: option, index })}
              data-testid={`option-${index}`}
            >
              {option.value.name}
              {index === highlightedIndex && ' (highlighted)'}
            </li>
          ))}
      </ul>
    </div>
  );
}

// ── 테스트 ──

describe('useSelect', () => {
  describe('초기 상태', () => {
    it('닫힌 상태로 시작한다', () => {
      const { result } = renderHook(() => useSelect({ options: FRUITS }));
      expect(result.current.isOpen).toBe(false);
      expect(result.current.selectedOption).toBeNull();
      expect(result.current.highlightedIndex).toBe(-1);
    });
  });

  describe('열기/닫기', () => {
    it('토글 버튼 클릭으로 열고 닫을 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);
      expect(screen.getByTestId('option-0')).toBeInTheDocument();

      await user.click(toggle);
      expect(screen.queryByTestId('option-0')).not.toBeInTheDocument();
    });

    it('Enter 키로 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      toggle.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('option-0')).toBeInTheDocument();
    });

    it('Space 키로 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      toggle.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('option-0')).toBeInTheDocument();
    });

    it('Escape 키로 닫을 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);
      expect(screen.getByTestId('option-0')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('option-0')).not.toBeInTheDocument();
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
      expect(
        screen.getByRole('option', { name: /사과/ }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '외부 영역' }));
      expect(
        screen.queryByRole('option', { name: /사과/ }),
      ).not.toBeInTheDocument();
    });

    it('ArrowDown으로 열 수 있다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      toggle.focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByTestId('option-0')).toBeInTheDocument();
    });
  });

  describe('키보드 이동', () => {
    it('ArrowDown으로 다음 항목으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      // 처음 열면 첫 번째 enabled 항목이 하이라이트
      expect(screen.getByTestId('option-0')).toHaveTextContent('(highlighted)');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('option-1')).toHaveTextContent('(highlighted)');
    });

    it('ArrowUp으로 이전 항목으로 이동한다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      // 0 → 1 → ArrowUp → 0
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      expect(screen.getByTestId('option-0')).toHaveTextContent('(highlighted)');
    });

    it('품절 옵션을 건너뛴다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      // 0(사과) → 1(바나나) → 3(두리안, 2번 체리는 disabled)
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('option-1')).toHaveTextContent('(highlighted)');

      await user.keyboard('{ArrowDown}');
      // 체리(index 2)를 건너뛰고 두리안(index 3)
      expect(screen.getByTestId('option-3')).toHaveTextContent('(highlighted)');
    });

    it('끝에서 처음으로 순환한다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      // 0 → 1 → 3(skip 2) → 0(wrap)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('option-0')).toHaveTextContent('(highlighted)');
    });

    it('모든 옵션이 disabled면 하이라이트가 -1이다', () => {
      const { result } = renderHook(() => useSelect({ options: ALL_DISABLED }));

      act(() => {
        // 직접 열기 시도
        const props = result.current.getToggleButtonProps();
        props.onClick();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.highlightedIndex).toBe(-1);
    });
  });

  describe('선택', () => {
    it('Enter로 하이라이트된 항목을 선택한다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);
      await user.keyboard('{ArrowDown}'); // 바나나로 이동
      await user.keyboard('{Enter}');

      expect(toggle).toHaveTextContent('바나나');
      // 선택 후 메뉴 닫힘
      expect(screen.queryByTestId('option-0')).not.toBeInTheDocument();
    });

    it('클릭으로 항목을 선택한다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);
      await user.click(screen.getByTestId('option-1'));

      expect(toggle).toHaveTextContent('바나나');
    });

    it('disabled 항목은 클릭해도 선택되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);
      await user.click(screen.getByTestId('option-2')); // 체리 (disabled)

      expect(toggle).toHaveTextContent('선택하세요');
    });
  });

  describe('prop getter', () => {
    it('getToggleButtonProps가 ARIA 속성을 반환한다', () => {
      const { result } = renderHook(() => useSelect({ options: FRUITS }));
      const props = result.current.getToggleButtonProps();

      expect(props.role).toBe('combobox');
      expect(props['aria-expanded']).toBe(false);
      expect(props['aria-haspopup']).toBe('listbox');
    });

    it('getMenuProps가 올바른 role을 반환한다', () => {
      const { result } = renderHook(() => useSelect({ options: FRUITS }));
      const props = result.current.getMenuProps();

      expect(props.role).toBe('listbox');
      expect(props['aria-hidden']).toBe(true);
    });

    it('getItemProps가 일반 옵션과 disabled 옵션의 접근성 상태를 반환한다', () => {
      const { result } = renderHook(() => useSelect({ options: FRUITS }));

      const normalProps = result.current.getItemProps({
        item: FRUITS[0],
        index: 0,
      });
      expect(normalProps.role).toBe('option');
      expect(normalProps['aria-disabled']).toBe(false);

      const disabledProps = result.current.getItemProps({
        item: FRUITS[2],
        index: 2,
      });
      expect(disabledProps.role).toBe('option');
      expect(disabledProps['aria-disabled']).toBe(true);
    });
  });

  describe('마우스 호버', () => {
    it('마우스 진입 시 하이라이트가 변경된다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      await user.hover(screen.getByTestId('option-3'));
      expect(screen.getByTestId('option-3')).toHaveTextContent('(highlighted)');
    });

    it('disabled 항목에 호버해도 하이라이트가 변경되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TestSelect />);

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      // 초기 하이라이트: 0
      expect(screen.getByTestId('option-0')).toHaveTextContent('(highlighted)');

      await user.hover(screen.getByTestId('option-2')); // disabled
      // 하이라이트 변경 안 됨
      expect(screen.getByTestId('option-0')).toHaveTextContent('(highlighted)');
    });
  });

  describe('controlled 모드', () => {
    it('외부에서 전달한 selectedOption이 반영된다', () => {
      const controlled = FRUITS[1];
      const { result } = renderHook(() =>
        useSelect({
          options: FRUITS,
          selectedOption: controlled,
        }),
      );

      expect(result.current.selectedOption).toBe(controlled);
    });

    it('onSelectedOptionChange 콜백이 선택 시 호출된다', async () => {
      const user = userEvent.setup();
      let captured: SelectOption<Fruit> | null = null;

      function ControlledSelect() {
        const {
          isOpen,
          containerRef,
          getToggleButtonProps,
          getMenuProps,
          getItemProps,
        } = useSelect({
          options: FRUITS,
          selectedOption: FRUITS[0],
          onSelectedOptionChange: (opt) => {
            captured = opt;
          },
        });

        return (
          <div ref={containerRef}>
            <button {...getToggleButtonProps()} data-testid="toggle">
              선택
            </button>
            <ul {...getMenuProps()}>
              {isOpen &&
                FRUITS.map((option, index) => (
                  <li
                    key={option.value.id}
                    {...getItemProps({ item: option, index })}
                    data-testid={`option-${index}`}
                  >
                    {option.value.name}
                  </li>
                ))}
            </ul>
          </div>
        );
      }

      render(<ControlledSelect />);
      await user.click(screen.getByTestId('toggle'));
      await user.click(screen.getByTestId('option-1'));

      expect(captured).toBe(FRUITS[1]);
    });
  });
});
