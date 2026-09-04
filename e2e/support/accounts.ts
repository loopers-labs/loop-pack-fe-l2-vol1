import { accounts } from "@/app/api/_data/auth";

// ── 병렬 실행에서 무엇을 갈랐는가: 계정 ─────────────────────────────────────
// 서버의 주문 저장소는 프로세스 메모리의 Map 하나이고(`ordersByUser`) 워커마다
// 서버를 띄우지 않는다. 그래서 **데이터**나 **스토리지**를 가르는 것으로는 부족하다 —
// 두 워커가 같은 계정으로 주문하면 서로의 주문이 상대 목록에 보인다.
//
// 계정을 가르면 `listOrders(userId)`가 사용자별로 분리되므로 주문이 섞이지 않는다.
// 스타터가 계정을 8개 준 이유가 여기다.
//
// parallelIndex는 "동시에 도는 워커 슬롯" 번호다(0부터). workerIndex와 다르다 —
// workerIndex는 재시작할 때마다 늘어나서 8을 넘을 수 있다.
export const accountFor = (parallelIndex: number) => {
  const account = accounts[parallelIndex % accounts.length];
  if (account === undefined) {
    throw new Error("계정 목록이 비어 있습니다.");
  }
  return account;
};

export const TEST_PASSWORD_VALUE = "looper1234";
