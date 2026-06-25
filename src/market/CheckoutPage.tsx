import { useState } from 'react';
import { OrderSheet } from './OrderSheet';
import { OrderResultModal } from './OrderResultModal';
import './market.css';

export function CheckoutPage() {
  const [placed, setPlaced] = useState(false);
  const [finalPrice, setFinalPrice] = useState(0); // 결제 시점에 확정된 금액(결과 모달 표시용)

  const handlePlace = (placedFinalPrice: number) => {
    setFinalPrice(placedFinalPrice);
    setPlaced(true);
  };

  if (placed) {
    return <OrderResultModal finalPrice={finalPrice} onClose={() => setPlaced(false)} />;
  }
  return <OrderSheet onPlace={handlePlace} />;
}
