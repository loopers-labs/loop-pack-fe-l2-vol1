import { formatWon } from '@/shared/lib/format';

interface OrderPaymentSummaryProps {
  itemCount: number;
  total: number;
  isPending: boolean;
  isReady: boolean;
  errorMessage?: string;
}

export function OrderPaymentSummary({
  itemCount,
  total,
  isPending,
  isReady,
  errorMessage,
}: OrderPaymentSummaryProps) {
  const isDisabled = !isReady || isPending;

  return (
    <aside className="rounded-lg border border-border bg-bg-card p-6 md:sticky md:top-24">
      <h2 className="text-xl font-bold tracking-[-0.02em] text-text">
        결제 금액
      </h2>
      <div className="mt-6 flex items-center justify-between border-b border-border pb-5 text-[14px]">
        <span className="text-text-secondary">상품 {itemCount}개</span>
        <span className="font-medium text-text">{formatWon(total)}</span>
      </div>
      <div className="flex items-end justify-between gap-4 py-6">
        <strong className="text-[14px] text-text">총 결제 금액</strong>
        <strong className="text-xl text-text">{formatWon(total)}</strong>
      </div>
      <p className="rounded-lg bg-neutral-50 px-4 py-3 text-xs leading-5 text-text-secondary">
        표시 금액은 현재 상품 가격을 기준으로 계산됩니다.
      </p>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-border bg-neutral-50 px-4 py-3 text-[13px] leading-5 text-text"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-lg bg-text px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? '주문 처리 중...' : `${formatWon(total)} 주문하기`}
      </button>
    </aside>
  );
}
