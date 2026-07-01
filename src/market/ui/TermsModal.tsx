import { Modal } from '../../shared/ui/modal/ModalProvider';

export const TermsModal = () => {
  return (
    <Modal.Content>
      <h3>이용 약관</h3>
      <p>주문 후 7일 이내 단순 변심 반품이 가능하며, 도서산간은 배송비가 추가됩니다.</p>
      <Modal.Close>
        <button>닫기</button>
      </Modal.Close>
    </Modal.Content>
  );
};
