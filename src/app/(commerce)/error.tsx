"use client";

type CommerceRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CommerceRouteError({ error, reset }: CommerceRouteErrorProps) {
  return (
    <section
      className="mt-10 rounded-gds-md bg-white px-5 py-10 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]"
      aria-labelledby="commerce-route-error-title"
    >
      <h1 id="commerce-route-error-title" className="text-2xl font-bold text-gds-gray-900">
        화면을 불러오지 못했습니다.
      </h1>
      <p className="mt-3">
        {error.message.trim().length > 0 ? error.message : "예상하지 못한 오류가 발생했습니다."}
      </p>
      <button
        className="mt-5 cursor-pointer rounded-gds-sm border border-gds-cta bg-gds-cta px-4 py-2 font-semibold text-white hover:bg-gds-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
        type="button"
        onClick={reset}
      >
        다시 시도
      </button>
    </section>
  );
}
