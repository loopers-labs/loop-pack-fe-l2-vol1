import { useState } from "react";

import { Card } from "./card";
import styles from "./TermsCard.module.css";

interface TermsCardProps {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
}

// agreed는 결제 버튼(disabled={!agreed})이 읽는 공유 상태라 checkoutPage에서 관리하고, props로 받음.
// 반면 isTermsOpen은 약관 모달 여닫기에만 쓰여 밖에서 읽을 일이 없으므로 카드에서 관리.
// → 한 카드 안에서도 "밖이 읽는 값(agreed)"과 "안에서 끝나는 값(isTermsOpen)"의 소유 위치가 갈림.
export function TermsCard({ agreed, onAgreedChange }: TermsCardProps) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <Card>
        <Card.Body>
          <label>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => onAgreedChange(e.target.checked)}
            />
            주문 내용 및 약관에 동의합니다
          </label>
          <button className="link" onClick={() => setIsTermsOpen(true)}>
            약관 보기
          </button>
        </Card.Body>
      </Card>

      {/* 약관 모달은 isTermsOpen과 한 몸이라 이 카드 안에 같이 둠.
        지금은 약관에서만 쓰여 공통 Modal로 추상화하지 않음(반복되면 그때 분리). */}
      {isTermsOpen ? (
        <div className={styles.modal} onClick={() => setIsTermsOpen(false)}>
          <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
