import type { ReactNode } from 'react';

type ModalProps = {
  /** 모달이 열려 있는지 여부 */
  isOpen: boolean;
  /** 모달 제목 */
  title: string;
  /** 모달 본문 콘텐츠 */
  children?: ReactNode;
  /** 모달을 닫을 때 호출 */
  onClose: () => void;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
