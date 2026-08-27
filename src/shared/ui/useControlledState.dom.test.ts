import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useControlledState } from './useControlledState';

type HookProps = {
  controlled?: string;
  defaultValue?: string;
};

// Base UI useControlled.test 방식: hook을 직접 렌더하고 같은 인스턴스에 rerender로 새 props를 흘린다
function renderControlledState(initialProps: HookProps = {}) {
  return renderHook(
    ({ controlled, defaultValue = '기본값' }: HookProps) =>
      useControlledState({
        controlled,
        defaultValue,
        component: 'TestComponent',
        prop: 'value',
      }),
    { initialProps },
  );
}

describe('uncontrolled', () => {
  it('defaultValue로 시작하고 setter로 값이 바뀐다', () => {
    const { result } = renderControlledState();

    expect(result.current[0]).toBe('기본값');

    act(() => result.current[1]('다음 값'));

    expect(result.current[0]).toBe('다음 값');
  });
});

describe('controlled', () => {
  it('prop 값을 읽고, 같은 인스턴스의 prop 변경을 따라간다', () => {
    const { result, rerender } = renderControlledState({ controlled: 'A' });

    expect(result.current[0]).toBe('A');

    rerender({ controlled: 'B' });

    expect(result.current[0]).toBe('B');
  });

  it('setter는 무시된다 — 값은 부모 prop만 따른다', () => {
    const { result } = renderControlledState({ controlled: 'A' });

    act(() => result.current[1]('다음 값'));

    expect(result.current[0]).toBe('A');
  });
});

describe('controlled↔uncontrolled 전환 금지', () => {
  it('모드를 유지하는 정상 사용에는 경고가 없다', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { rerender } = renderControlledState({ controlled: 'A' });
    rerender({ controlled: 'B' });

    const { result } = renderControlledState();
    act(() => result.current[1]('다음 값'));

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('controlled → uncontrolled 전환 시 console.error를 낸다', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { rerender } = renderControlledState({ controlled: 'A' });
    rerender({});

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'TestComponent: value prop이 controlled에서 uncontrolled로 바뀌었습니다',
      ),
    );
  });

  it('uncontrolled → controlled 전환 시 console.error를 낸다', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { rerender } = renderControlledState();
    rerender({ controlled: 'A' });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        'TestComponent: value prop이 uncontrolled에서 controlled로 바뀌었습니다',
      ),
    );
  });

  it('모드는 첫 렌더에 박제된다 — uncontrolled로 태어났으면 나중에 온 prop은 무시된다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, rerender } = renderControlledState();
    act(() => result.current[1]('내부 값'));

    rerender({ controlled: '나중에 온 prop' });

    expect(result.current[0]).toBe('내부 값');
  });
});
