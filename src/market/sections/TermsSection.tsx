import { useState } from 'react';
import { Modal } from '@/common/components/Modal.tsx';
import { Checkbox } from '@/common/components/Checkbox.tsx';

type Props = {
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
};

export function TermsSection({ agreed, onAgreedChange }: Props) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <div className="section">
        <Checkbox
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          caption="주문 내용 및 약관에 동의합니다"
        />
        <button className="link" onClick={() => setIsTermsOpen(true)}>
          약관 보기
        </button>
      </div>

      <Modal isOpen={isTermsOpen} title={'이용 약관'} onClose={() => setIsTermsOpen(false)}>
        <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
      </Modal>
    </>
  );
}
