// Select (Headless) — 4주차 1단계
//
// 요구사항 요약 (자세한 건 docs/assignments/week-04.md):
//   - 라이브러리/네이티브 <select> 없이 <div>/<ul> listbox로 직접 구현
//   - value는 문자열이 아니라 옵션 "객체 전체"
//   - 같은 로직으로 옵션 UI 3종(텍스트/썸네일/사이즈)을 렌더
//   - 키보드로 열기·이동(↑↓)·선택(Enter)·닫기(Esc)
//   - 품절 옵션은 키보드 이동에서 건너뛴다
//   - 각 옵션의 selected / highlighted / disabled 를 사용처가 알 수 있게 노출
//

import { type ReactNode } from 'react';
import { useSelectRoot, type UseSelectRootParams } from './hooks/useSelectRoot';
import { SelectContext } from './context/context';
import { Trigger } from './components/trigger';
import { Value } from './components/value';
import { Content } from './components/content';

type SelectRootProps = UseSelectRootParams & {
  children: ReactNode;
};

/**
 * @description 기본으로 제공하는 디자인을 그대로 사용하고자 할때 사용
 * @param param0
 * @param param0.options select 옵션들
 * @param param0.value controlled인 경우 사용
 * @param param0.defaultValue unControlled인 경우 사용
 * @param param0.onChange selectBox가 달라졌을 때
 * @param param0.children 컴파운드 조각들
 */
export function Select({ options, value, defaultValue, onChange, children }: SelectRootProps) {
  //select 데이터를 제어하기 위한 hook
  const select = useSelectRoot({ options, value, defaultValue, onChange });

  return (
    <SelectContext value={select}>
      <div className="select-root">{children}</div>
    </SelectContext>
  );
}

Select.Trigger = Trigger;
Select.Value = Value;
Select.Content = Content;
