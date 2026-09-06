// @vitest-environment jsdom

import '@/test/setupDom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderPaymentSummary } from './OrderPaymentSummary';

describe('OrderPaymentSummary', () => {
  it('총 상품 금액에서 할인 금액을 분리하고 실제 결제 예정 금액을 표시한다', () => {
    render(
      <OrderPaymentSummary
        itemCount={2}
        priceSummary={{
          originalTotal: 316_000,
          discountTotal: 40_000,
          paymentTotal: 276_000,
        }}
        isPending={false}
        isReady
      />,
    );

    const summary = screen.getByRole('complementary');

    expect(
      within(summary).getByRole('heading', { name: '결제 예정 금액' }),
    ).toBeInTheDocument();
    expect(within(summary).getByText('총 상품 금액')).toBeInTheDocument();
    expect(within(summary).getByText('316,000원')).toBeInTheDocument();
    expect(within(summary).getByText('할인 금액')).toBeInTheDocument();
    expect(within(summary).getByText('-40,000원')).toBeInTheDocument();
    expect(within(summary).getByText('최종 결제 금액')).toBeInTheDocument();
    expect(within(summary).getAllByText('276,000원')).toHaveLength(1);
    expect(
      within(summary).getByRole('button', { name: '276,000원 주문하기' }),
    ).toBeEnabled();
  });
});
