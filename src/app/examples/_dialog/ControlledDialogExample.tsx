'use client';

import { useState } from 'react';
import { Dialog } from '@/shared/ui/dialog';
import styles from './dialog-example.module.css';

const couponOptions = ['10% 할인 쿠폰', '무료배송 쿠폰', '첫 구매 5,000원 할인'];

export function ControlledDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.triggerButton} onClick={() => setOpen(true)}>
        쿠폰 적용하기
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Overlay />
        <Dialog.Content size="md">
          <Dialog.Title>쿠폰 적용</Dialog.Title>
          <Dialog.Description>
            open 상태를 이 컴포넌트가 직접 소유합니다 (controlled).
          </Dialog.Description>
          <ul className={styles.optionList}>
            {couponOptions.map((coupon) => (
              <li key={coupon} className={styles.optionItem}>
                {coupon}
              </li>
            ))}
          </ul>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
