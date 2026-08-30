import { track } from "@/shared/analytics";

// 주문 플로우가 소유한 이벤트. 시작=주문 실행 시도, 완료=성공.
// productIds 는 주문에 담긴 상품 id 들(카트 일괄 주문이라 여러 개). 개수는 length 로 파생.
export function trackOrderStart(productIds: string[]): void {
  track("order_start", { props: { productIds } });
}

export function trackOrderComplete(productIds: string[]): void {
  track("order_complete", { props: { productIds } });
}
