import { Dialog } from "../index";
import styles from "./demos.module.css";

export function AsChildModal() {
  return (
    <Dialog>
      <Dialog.Trigger asChild>
        <a
          href="#"
          role="button"
          className={styles.link}
          onClick={(event) => event.preventDefault()}
        >
          링크로 열기 (asChild)
        </a>
      </Dialog.Trigger>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.dialogContent}>
        <Dialog.Title asChild>
          <h1 className={styles.dialogTitleH1}>제목이 h1 (asChild)</h1>
        </Dialog.Title>
        <Dialog.Description>
          Trigger 가 button 이 아니라 &lt;a&gt; 로 렌더된다. 자식 자체
          onClick(preventDefault)과 열기 동작이 함께 실행된다(핸들러 합성).
        </Dialog.Description>
        <Dialog.Close className={styles.button}>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}
