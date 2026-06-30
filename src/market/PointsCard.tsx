import { Card } from "./card";

interface PointsCardProps {
  point: number; // 보유 적립금 (member.point)
  usePoint: boolean;
  pointInput: number;
  onUsePointChange: (use: boolean) => void;
  onPointInputChange: (value: number) => void;
}

// usePoint·pointInput 둘 다 checkoutPage에서 관리
// 두 값 모두 금액 계산(pointDiscount)이 실시간으로 읽어야 하는 공유 상태라, 카드는 자체 상태 없이 값과 변경 콜백만 받아 입력 UI를 그림
export function PointsCard({
  point,
  usePoint,
  pointInput,
  onUsePointChange,
  onPointInputChange,
}: PointsCardProps) {
  return (
    <Card>
      <Card.Title>적립금</Card.Title>
      <Card.Body>
        <label>
          <input
            type="checkbox"
            checked={usePoint}
            onChange={(e) => onUsePointChange(e.target.checked)}
          />
          적립금 사용 (보유 {point.toLocaleString()}P)
        </label>
        {usePoint ? (
          <input
            type="number"
            value={pointInput}
            onChange={(e) => onPointInputChange(Number(e.target.value))}
          />
        ) : null}
      </Card.Body>
    </Card>
  );
}
