"use client";

import { useQuery } from "@tanstack/react-query";
import { orderQueries } from "@/entities/order";
import { OrderHistoryContent } from "./OrderHistoryContent";
import { OrderHistoryList } from "./OrderHistoryList";

export function OrderHistoryPage() {
  const ordersQuery = useQuery(orderQueries.list());
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <section className="mt-10 grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-gds-green-700">Orders</p>
        <h1 className="text-3xl font-bold tracking-tight text-gds-gray-900">주문 내역</h1>
        <p className="text-sm leading-6 text-gds-gray-700">
          완료한 주문의 상태와 상품 정보를 확인합니다.
        </p>
      </div>

      <OrderHistoryContent
        isLoading={ordersQuery.isPending}
        error={ordersQuery.error}
        isEmpty={orders.length === 0}
        totalCount={orders.length}
        onRetry={() => void ordersQuery.refetch()}
      >
        <OrderHistoryList orders={orders} />
      </OrderHistoryContent>
    </section>
  );
}
