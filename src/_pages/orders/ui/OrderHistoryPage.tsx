export function OrderHistoryPage() {
  return (
    <section className="mt-10 grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-gds-green-700">Orders</p>
        <h1 className="text-3xl font-bold tracking-tight text-gds-gray-900">주문 내역</h1>
        <p className="text-sm leading-6 text-gds-gray-700">
          완료한 주문의 상태와 상품 정보를 확인합니다.
        </p>
      </div>

      <div className="rounded-gds-lg bg-white p-6 text-sm text-gds-gray-700 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)]">
        아직 주문 내역이 없습니다.
      </div>
    </section>
  );
}
