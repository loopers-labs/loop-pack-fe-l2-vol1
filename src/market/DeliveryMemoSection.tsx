import { useState } from "react";
import { Section } from "./Section";

export function DeliveryMemoSection() {
  const [memo, setMemo] = useState("");
  return (
    <Section title="배송 요청사항">
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="배송 시 요청사항 (예: 부재 시 문 앞에 두세요)"
      />
    </Section>
  );
}
