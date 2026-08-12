const GC_TIME_MINUTES = 5;

/** 타임세일이 짧으면 25분 단위로도 돌아 가격이 자주 바뀔 수 있어 짧은 주기로 재확인한다 */
export const PRODUCT_PRICE_STALE_TIME = 60 * 1000;
export const PRODUCT_PRICE_GC_TIME = GC_TIME_MINUTES * 60 * 1000;

/** 목록 갱신 실패를 사용자에게 알리기까지 허용할 자동 재시도 횟수.
 *  React Query 기본값 3회는 지수 백오프(1s·2s·4s)까지 겹쳐 실패 노출이 9초 넘게 밀린다(Part 4 실측 9,123ms).
 *  필터 변경은 사용자가 방금 일으킨 상호작용이라 그만큼 기다리게 둘 이유가 없고,
 *  이전 목록이 남아 있는 데다 명시적인 "다시 시도" 버튼도 제공하므로 1회로 줄인다 */
export const PRODUCT_LIST_RETRY_COUNT = 1;
