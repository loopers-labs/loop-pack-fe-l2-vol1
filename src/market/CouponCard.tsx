import { useState } from "react";

import { Card } from "./card";
import type { Coupon } from "./types";

interface CouponCardProps {
  appliedCoupon: Coupon | null;
  onApply: (code: string) => void;
}

// 상태 소유권 기준: "이 값을 누가 읽어야 하는가"로 위치를 정함
// couponCode(입력 중 값): 이 카드 외엔 사용 안함 → 쿠폰카드에서 useState 관리
// appliedCoupon(적용 결과): 페이지의 금액 계산이 읽어야 함 → CheckoupPage에서 props로 받음
// 입력은 CouponCard 에서 관리, 확정된 결과만 onApply로 올려보내 관심사를 분리(위임)
export function CouponCard({ appliedCoupon, onApply }: CouponCardProps) {
  const [couponCode, setCouponCode] = useState("");

  return (
    <Card>
      <Card.Title>쿠폰</Card.Title>
      <Card.Body>
        <div className="row">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="쿠폰 코드 (예: WELCOME5000)"
          />
          <button onClick={() => onApply(couponCode)}>적용</button>
        </div>
        {appliedCoupon ? <small>{appliedCoupon.label} 적용됨</small> : null}
      </Card.Body>
    </Card>
  );
}
