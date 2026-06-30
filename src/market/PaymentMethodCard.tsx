import { useState } from "react";

import { Card } from "./card";
import type { PaymentMethod } from "./types";

// payment 관련 상수를 이 카드로 옮긴 이유:
// 결제수단 값과 라벨은 이 카드 안에서만 쓰이고, 다른 카드는 참조하지 않음
// 함께 바뀌고 함께 쓰이는 것을 같은 파일에 두어, 결제수단 관련 변경이 이 파일에서 끝나도록 응집도를 높임
const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  card: "신용/체크카드",
  transfer: "계좌이체",
  kakao: "카카오페이",
};

// as PaymentMethod[]가 아니라 satisfies로 검증하는 이유 -> AI가 짜준 코드
// as는 단언이라 잘못된 값("transfee" 같은 오타)도 그냥 통과시킴
// satisfies는 PaymentMethod와 일치하는지 검사해주면서, 동시에 리터럴 타입을 좁게 유지해 map의 m이 정확한 union으로 추론되게 함
const PAYMENT_METHODS = ["card", "transfer", "kakao"] as const satisfies readonly PaymentMethod[];

export function PaymentMethodCard() {
  const [payment, setPayment] = useState<PaymentMethod>("card");

  return (
    <Card>
      <Card.Title>결제수단</Card.Title>
      <Card.Body>
        {PAYMENT_METHODS.map((m) => (
          <label key={m}>
            <input type="radio" checked={payment === m} onChange={() => setPayment(m)} />
            {PAYMENT_LABEL[m]}
          </label>
        ))}
      </Card.Body>
    </Card>
  );
}
