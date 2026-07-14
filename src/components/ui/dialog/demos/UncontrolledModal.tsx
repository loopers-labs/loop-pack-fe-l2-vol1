import { Dialog } from "../index";
import styles from "./demos.module.css";

export function UncontrolledModal() {
  return (
    <Dialog>
      <Dialog.Trigger className={styles.button}>
        열기 (uncontrolled)
      </Dialog.Trigger>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.dialogContent}>
        <Dialog.Title>uncontrolled (modal)</Dialog.Title>
        <Dialog.Description>
          open prop 없음 → 내부 state. Esc · 오버레이 클릭 · 닫기 버튼으로
          닫히고, 열린 동안 배경 스크롤이 잠긴다.
        </Dialog.Description>
        <Dialog.Close className={styles.button}>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}
