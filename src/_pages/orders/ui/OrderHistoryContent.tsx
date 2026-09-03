import type { ReactNode } from "react";

type OrderHistoryContentProps = {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  totalCount: number;
  onRetry: () => void;
  children: ReactNode;
};

export function OrderHistoryContent({
  isLoading,
  error,
  isEmpty,
  totalCount,
  onRetry,
  children,
}: OrderHistoryContentProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-gds-lg bg-white p-6 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
        aria-label="주문 내역을 불러오는 중입니다."
      >
        주문 내역을 불러오는 중입니다.
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="grid gap-4 rounded-gds-lg bg-white p-6 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        <p className="font-semibold text-gds-red-500">{error.message}</p>
        <button
          className="w-fit rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          type="button"
          onClick={onRetry}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm font-semibold text-gds-gray-900">총 {totalCount}건</p>
      {isEmpty ? (
        <div className="rounded-gds-lg bg-white p-6 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
          아직 주문 내역이 없습니다.
        </div>
      ) : (
        children
      )}
    </>
  );
}
