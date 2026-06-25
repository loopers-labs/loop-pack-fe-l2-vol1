interface TermsModalProps {
  onClose: () => void;
}

/**
 * 이용 약관 모달.
 *
 * - 원인: 약관 모달 JSX가 페이지에 인라인이라 페이지 길이를 키움 → 결과: 컴포넌트로 추출해 페이지에서 분리.
 */
const TermsModal = ({ onClose }: TermsModalProps) => {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <h3>이용 약관</h3>
        <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default TermsModal;
