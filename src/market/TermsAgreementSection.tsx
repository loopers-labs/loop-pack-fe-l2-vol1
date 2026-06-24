import { useState } from "react";

type TermsAgreementSectionProps = {
  isTermsAgreed: boolean;
  onTermsAgreementChange: (isAgreed: boolean) => void;
};

export function TermsAgreementSection({
  isTermsAgreed,
  onTermsAgreementChange,
}: TermsAgreementSectionProps) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleOpenTerms = () => {
    setIsTermsOpen(true);
  };

  const handleCloseTerms = () => {
    setIsTermsOpen(false);
  };

  const handleModalBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="section">
        <label>
          <input
            type="checkbox"
            checked={isTermsAgreed}
            onChange={(e) => onTermsAgreementChange(e.target.checked)}
          />
          주문 내용 및 약관에 동의합니다
        </label>
        <button className="link" onClick={handleOpenTerms}>
          약관 보기
        </button>
      </div>
      {isTermsOpen ? (
        <div className="modal" onClick={handleCloseTerms}>
          <div className="modal-body" onClick={handleModalBodyClick}>
            <h3>이용 약관</h3>
            <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
            <button onClick={handleCloseTerms}>닫기</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
