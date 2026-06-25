import { Section } from "../ui/Section";

type PointSectionProps = {
  isUsingPoint: boolean;
  memberPoint: number;
  pointInput: number;
  onIsUsingPointChange: (isUsingPoint: boolean) => void;
  onPointInputChange: (newInput: number) => void;
};

export function PointSection({
  isUsingPoint,
  memberPoint,
  pointInput,
  onIsUsingPointChange,
  onPointInputChange,
}: PointSectionProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = Number(e.target.value);
    const finalValue = Math.min(memberPoint, Math.max(inputValue, 0));
    onPointInputChange(finalValue);
  };
  return (
    <Section title="적립금">
      <label>
        <input
          type="checkbox"
          checked={isUsingPoint}
          onChange={(e) => onIsUsingPointChange(e.target.checked)}
        />
        적립금 사용 (보유 {memberPoint.toLocaleString()}P)
      </label>
      {isUsingPoint ? (
        <input
          type="number"
          min={0}
          max={memberPoint}
          value={pointInput.toString()}
          onChange={handleInputChange}
        />
      ) : null}
    </Section>
  );
}
