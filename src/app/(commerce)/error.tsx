"use client";

// (commerce) 그룹의 error boundary. Header layout 안쪽이라 에러가 나도 Header·nav는 유지되고
// 본문(목록·홈) 자리에만 에러를 보인다(2단계 "목록 대신 실패 이유"). reset()으로 세그먼트를 재렌더해 재시도한다.
// layout이 이미 `<main>`을 감싸므로 여기선 `<section>`으로 둔다(main 중첩 방지).
interface AppErrorProps {
  error: Error;
  reset: () => void;
}

export default function AppError({ reset }: AppErrorProps) {
  return (
    <section className="mx-auto max-w-[560px] px-6 py-16 text-center">
      <p className="mb-4 text-gray-700">문제가 발생했어요. 잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        다시 시도
      </button>
    </section>
  );
}
