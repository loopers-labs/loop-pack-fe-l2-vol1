import { useState } from 'react';
import { ModalContext, useModal } from './useModal';

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [opened, setOpened] = useState(false);

  const open = () => setOpened(true);
  const close = () => setOpened(false);

  return <ModalContext.Provider value={{ open, close, opened }}>{children}</ModalContext.Provider>;
};

const ModalTrigger = ({ children }: { children: React.ReactNode }) => {
  const { open } = useModal();

  return <div onClick={open}>{children}</div>;
};

const ModalWrapper = ({ children }: { children: React.ReactNode }) => {
  const { close, opened } = useModal();
  if (!opened) return null;
  return (
    <div className="modal" onClick={close}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const ModalClose = ({ children }: { children: React.ReactNode }) => {
  const { close } = useModal();
  return <div onClick={close}>{children}</div>;
};

const ModalRoot = ({ children }: { children: React.ReactNode }) => {
  return <ModalProvider>{children}</ModalProvider>;
};

export const Modal = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Content: ModalWrapper,
  Close: ModalClose,
});
