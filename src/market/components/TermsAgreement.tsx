import { useState } from "react";
import CheckoutTerms from "./CheckoutTerms";

export default function TermsAgreement({
  agreed,
  onChangeAgreed,
}: {
  agreed: boolean;
  onChangeAgreed: (agreed: boolean) => void;
}) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const handleOpenTerms = () => setIsTermsOpen(true);
  const handleCloseTerms = () => setIsTermsOpen(false);

  return (
    <div className="section">
      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChangeAgreed(e.target.checked)}
        />
        주문 내용 및 약관에 동의합니다
      </label>
      <button className="link" onClick={handleOpenTerms}>
        약관 보기
      </button>
      {isTermsOpen ? <CheckoutTerms onClose={handleCloseTerms} /> : null}
    </div>
  );
}
