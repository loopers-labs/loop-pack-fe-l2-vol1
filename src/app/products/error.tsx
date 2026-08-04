"use client";

import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";

type ProductsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  const { reset: resetQueryErrors } = useQueryErrorResetBoundary();

  return (
    <Placeholder
      role="alert"
      title="상품 목록을 표시하지 못했어요"
      description={error instanceof CommerceApiError ? error.message : "일시적인 오류일 수 있어요."}
      action={
        <button
          type="button"
          onClick={() => {
            resetQueryErrors();
            reset();
          }}
        >
          다시 시도
        </button>
      }
    />
  );
}
