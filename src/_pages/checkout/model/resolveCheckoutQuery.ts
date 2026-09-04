import { isKnownProductId } from "@/app/api/_data/auth";

export type ResolvedCheckoutQuery = {
  productId: string | null;
  quantity: number;
};

const MAX_QUANTITY = 10;

// ── 주문서는 무엇을 살지를 URL로 받는다 ─────────────────────────────────────
// 장바구니(zustand)에서 읽지 않는 이유가 셋이다.
//   1) 미로그인으로 주문서에 들어오면 proxy가 로그인으로 되돌린다. 그건 문서
//      전환이라 메모리 store가 초기화된다. 돌아왔을 때 장바구니가 비어 있으면
//      "원래 경로 복원"이 말만 복원이고 화면은 빈 상태가 된다.
//   2) 시드 로그의 `order_start`·`order_complete` props가 `productId` 하나다.
//      스키마가 단일 상품 주문을 전제한다.
//   3) 3주차부터 이 앱의 조건은 URL이 소유한다. 공유·새로고침·뒤로가기가 공짜다.
//
// 방어적으로 좁힌다. 이 값들은 주소창에서 온다.
export function resolveCheckoutQuery(
  params: Record<string, string | string[] | undefined>,
): ResolvedCheckoutQuery {
  const rawId = params.productId;
  const productId = typeof rawId === "string" && isKnownProductId(rawId) ? rawId : null;

  const rawQuantity = params.quantity;
  const parsed = typeof rawQuantity === "string" ? Number(rawQuantity) : 1;
  const quantity = Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_QUANTITY ? parsed : 1;

  return { productId, quantity };
}
