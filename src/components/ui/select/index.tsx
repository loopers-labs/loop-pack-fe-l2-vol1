// Select (Headless) — 4주차 1단계
//
// 로직 한 벌 = useSelect 훅. "생김새"는 사용처가 갈아끼운다(→ src/app/select-demo).
// 훅이 상태(selected/highlighted/disabled)와 핸들러만 노출하므로, 같은 로직으로
// 텍스트·사이즈·썸네일 등 서로 다른 옵션 UI를 렌더할 수 있다.

export { useSelect } from './useSelect';
export type {
  UseSelect,
  UseSelectConfig,
  OptionState,
  OptionProps,
  TriggerProps,
  ListProps,
} from './useSelect';
