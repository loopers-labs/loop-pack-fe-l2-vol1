import { useCallback, useEffect, useRef, useState } from 'react';

// controlled(값 제공)/uncontrolled(미제공) 여부는 첫 렌더에 확정되고 이후 바뀌지 않는다 (Base UI useControlled 방식).
// 전환은 지원하지 않으므로 dev 모드에서 console.error로 알린다.
export function useControlledState<T>({
  controlled,
  defaultValue,
  component,
  prop,
}: {
  controlled: T | undefined;
  defaultValue: T;
  component: string;
  prop: string;
}) {
  const { current: isControlled } = useRef(controlled !== undefined);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = isControlled ? (controlled as T) : uncontrolledValue;

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (isControlled !== (controlled !== undefined)) {
      const from = isControlled ? 'controlled' : 'uncontrolled';
      const to = isControlled ? 'uncontrolled' : 'controlled';
      console.error(
        `${component}: ${prop} prop이 ${from}에서 ${to}로 바뀌었습니다. controlled 여부는 첫 렌더에 확정되며 전환은 지원하지 않습니다. 컴포넌트 수명 동안 한 방식을 유지하세요.`,
      );
    }
  }, [isControlled, controlled, component, prop]);

  const setValueIfUncontrolled = useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
    },
    [isControlled],
  );

  return [value, setValueIfUncontrolled] as const;
}
