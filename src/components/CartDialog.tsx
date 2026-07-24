'use client';

import Link from 'next/link';
import { Dialog } from '@/components/ui/dialog';
import { useCartStore } from '@/store/cartStore';
import { formatWon } from '@/utils/format';

export function CartDialog() {
  const lastAddedItem = useCartStore((s) => s.lastAddedItem);
  const clearLastAdded = useCartStore((s) => s.clearLastAdded);

  if (!lastAddedItem) return null;

  return (
    <Dialog open={!!lastAddedItem} onOpenChange={() => clearLastAdded()}>
      <Dialog.Overlay />
      <Dialog.Content>
        <div className="w-[320px] rounded-2xl bg-bg-card p-6 shadow-lg">
          <Dialog.Title className="text-[15px] font-semibold text-text">
            장바구니에 담았습니다.
          </Dialog.Title>

          <div className="mt-4 flex gap-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-bg">
              <img
                src={lastAddedItem.image}
                alt={lastAddedItem.name}
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-text">
                {lastAddedItem.name}
              </p>
              <p className="mt-1 text-[14px] font-semibold text-text">
                {formatWon(lastAddedItem.price)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Dialog.Close className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg">
              계속 쇼핑하기
            </Dialog.Close>
            <Link
              href="/cart"
              onClick={clearLastAdded}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-text text-[13px] font-semibold text-bg-card transition-colors hover:bg-text/90"
            >
              장바구니 보기
            </Link>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
