import { useState } from 'react';

type Props = {
  isAgreed: boolean;
  onAgreeChange: (value: boolean) => void;
};

// isTermsOpen은 모달 열고 닫기만 하는 UI 상태라 CheckoutPage가 알 필요 없음
export function TermsAgreement({ isAgreed, onAgreeChange }: Props) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div className="section">
      <label>
        <input
          type="checkbox"
          checked={isAgreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
        />
        주문 내용 및 약관에 동의합니다.
      </label>
      <button className="link" onClick={() => setIsTermsOpen(true)}>
        약관 보기
      </button>

      {isTermsOpen && (
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
      )}
    </div>
  );
}
