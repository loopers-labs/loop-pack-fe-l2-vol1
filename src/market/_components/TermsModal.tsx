/** ⑩ children vs slot: 모달 overlay/dismiss 패턴과 약관 콘텐츠를 분리, isOpen/onClose로 제어 */
export const TermsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <h3>이용 약관</h3>
        <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
