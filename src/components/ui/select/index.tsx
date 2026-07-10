// Select (Headless) — 로직은 useSelect 훅 한 벌, 생김새는 사용처가 그린다.
// 컴포넌트를 export하지 않는 게 의도다: 마크업까지 제공하면 headless가 아니다.

export { useSelect } from './useSelect'
export type { SelectOptionState } from './useSelect'
