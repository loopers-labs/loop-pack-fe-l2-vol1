import { SectionContainer } from '../shared/ui/container';
import { Modal } from '../../shared/ui/modal/ModalProvider';

export const Terms = ({
  agreed,
  onToggleCheckbox,
}: {
  agreed: boolean;
  onToggleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <SectionContainer>
      <label>
        <input type="checkbox" checked={agreed} onChange={onToggleCheckbox} />
        주문 내용 및 약관에 동의합니다
      </label>
      <Modal.Trigger>
        <button className="link">약관 보기</button>
      </Modal.Trigger>
    </SectionContainer>
  );
};
