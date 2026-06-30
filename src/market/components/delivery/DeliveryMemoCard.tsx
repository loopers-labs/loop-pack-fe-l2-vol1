import { useState } from "react";

import { Card } from "@/market/card";

// DeliveryMemo(textarea)는 배송 요청사항 카드에서만 쓰이고 다른 화면에서 재사용되지 않아,
// 제목+메모를 하나의 의미 단위로 묶어 분리. 동시에 다른 카드 컴포넌트들과 형식도 통일됨.
export function DeliveryMemoCard() {
  const [memo, setMemo] = useState("");
  return (
    <Card>
      <Card.Header>
        <Card.Title>배송 요청사항</Card.Title>
      </Card.Header>
      <Card.Body>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
        />
      </Card.Body>
    </Card>
  );
}
