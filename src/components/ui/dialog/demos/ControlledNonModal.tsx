import { useState } from "react";
import { Dialog } from "../index";
import styles from "./demos.module.css";

export function ControlledNonModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger className={styles.button}>
          열기 (controlled)
        </Dialog.Trigger>
        <Dialog.Content className={styles.dialogContent}>
          <Dialog.Title>controlled (non-modal)</Dialog.Title>
          <Dialog.Description>
            Overlay 를 안 깔았다 → dim·바깥클릭 닫기 없음. 부모가 open 을
            소유하니 아래 외부 버튼으로 똑같이 토글된다.
          </Dialog.Description>
          <Dialog.Close className={styles.button}>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>
      <button
        className={styles.button}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        외부에서 토글 ({isOpen ? "열림" : "닫힘"})
      </button>
    </>
  );
}
