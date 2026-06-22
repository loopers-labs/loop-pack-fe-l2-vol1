import { useState } from 'react';

import { SectionCard } from './SectionCard';

type Props = {
  agreed: boolean;
  onChangeAgreed: (agreed: boolean) => void;
};

export function TermsAgreement({ agreed, onChangeAgreed }: Props) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  return (
    <>
      <SectionCard>
        <label>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => onChangeAgreed(e.target.checked)}
          />
          주문 내용 및 약관에 동의합니다
        </label>
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </SectionCard>
      {isTermsOpen ? (
        <div className="modal" onClick={() => setIsTermsOpen(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <h3>이용 약관</h3>
            <p>
              주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가
              추가됩니다.
            </p>
            <button onClick={() => setIsTermsOpen(false)}>닫기</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
