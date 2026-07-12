"use client";

import { Dialog } from "@/shared/ui/dialog";

export interface PurchaseDialogProps {
  productName: string;
  priceLabel: string;
}

export function PurchaseDialog({ productName, priceLabel }: PurchaseDialogProps) {
  return (
    <Dialog>
      <Dialog.Trigger>구매하기</Dialog.Trigger>
      <Dialog.Overlay />
      <Dialog.Content>
        <Dialog.Title>{productName}</Dialog.Title>
        <Dialog.Description>{priceLabel}</Dialog.Description>
        <Dialog.Close>닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}
