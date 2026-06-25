import { type ReactNode, useState } from 'react';

import Section from './Section';

interface DeliverySectionProps {
  summary: string;
  children: ReactNode;
}

/**
 * 배송지 섹션 — 접기/펼치기와 선택 요약을 스스로 책임진다. 펼쳤을 때 폼은 `children` 슬롯으로 주입받는다.
 *
 * - 원인: 배송지 폼 의존이 섹션에 직접 묶여 결합도가 높음 → 결과: 폼을 `children`으로 주입받는 식으로 개선
 */
export function DeliverySection({ summary, children }: DeliverySectionProps) {
  const [expanded, setExpanded] = useState(false);

  const buttonText = expanded ? '접기' : '변경';

  return (
    <Section
      header={
        <div className="row between">
          <h2>배송지</h2>
          <button className="link" onClick={() => setExpanded((v) => !v)}>
            {buttonText}
          </button>
        </div>
      }
    >
      {expanded ? children : <p className="addr-summary">{summary}</p>}
    </Section>
  );
}
