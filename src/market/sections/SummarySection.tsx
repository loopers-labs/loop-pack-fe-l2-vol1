import { getPriceText } from '../../utils.ts';
import { Section } from '../../common/components/Section.tsx';
import { LineRow } from '../../common/components/LineRow.tsx';
import { PriceInfo } from '../../common/components/PriceInfo.tsx';

type SummarySectionProps = {
  itemTotal: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
  gradeDiscount: number;
  finalPrice: number;
};

export function SummarySection({
  itemTotal,
  shippingFee,
  couponDiscount,
  pointDiscount,
  gradeDiscount,
  finalPrice,
}: SummarySectionProps) {
  return (
    <Section title={'결제 금액'}>
      <LineRow rightSlot={<PriceInfo amount={itemTotal} />}>
        <span>{'상품 금액'}</span>
      </LineRow>
      <LineRow rightSlot={<PriceInfo amount={shippingFee} />}>
        <span>{'배송비'}</span>
      </LineRow>
      {gradeDiscount > 0 ? (
        <LineRow rightSlot={<PriceInfo amount={gradeDiscount} isDiscount />}>
          <span>{'등급 할인'}</span>
        </LineRow>
      ) : null}
      {couponDiscount > 0 ? (
        <LineRow rightSlot={<PriceInfo amount={couponDiscount} isDiscount />}>
          <span>{'쿠폰 할인'}</span>
        </LineRow>
      ) : null}
      {pointDiscount > 0 ? (
        // 적립금 사용의 경우 원이 아니라 P로 표기?
        <LineRow rightSlot={<PriceInfo amount={pointDiscount} isDiscount />}>
          <span>{'적립금 사용'}</span>
        </LineRow>
      ) : null}
      <div className="total">
        <span>최종 결제 금액</span>
        <strong>{getPriceText(finalPrice)}</strong>
      </div>
    </Section>
  );
}
