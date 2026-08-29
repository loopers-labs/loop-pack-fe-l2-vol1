import { track } from "@/shared/analytics";

// 주문 플로우가 소유한 이벤트. 시작=주문 실행 시도, 완료=성공. itemCount 는 주문 상품 수.
export function trackOrderStart(itemCount: number): void {
  track("order_start", { props: { itemCount } });
}

export function trackOrderComplete(itemCount: number): void {
  track("order_complete", { props: { itemCount } });
}
