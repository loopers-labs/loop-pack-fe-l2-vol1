'use client';

import { Dialog } from '@/shared/ui/dialog';
import styles from './dialog-example.module.css';

const addressOptions = ['집 (서울시 강남구 테헤란로)', '회사 (서울시 중구 을지로)', '기타'];

export function UncontrolledDialogExample() {
  return (
    <Dialog>
      <Dialog.Trigger className={styles.triggerButton}>배송지 변경</Dialog.Trigger>
      <Dialog.Overlay />
      <Dialog.Content size="sm">
        <Dialog.Title>배송지 변경</Dialog.Title>
        <Dialog.Description>배송받을 주소를 선택하세요.</Dialog.Description>
        <ul className={styles.optionList}>
          {addressOptions.map((address) => (
            <li key={address} className={styles.optionItem}>
              {address}
            </li>
          ))}
        </ul>
        <Dialog.Close>확인</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}
