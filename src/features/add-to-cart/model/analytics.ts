import { track } from "@/shared/analytics";

// 이 슬라이스가 소유한 이벤트. UI 는 track()·이벤트명·props 스키마를 모른 채 이 동사만 부른다.
export function trackCartAdd(productId: string): void {
  track("cart_add", { props: { productId } });
}
