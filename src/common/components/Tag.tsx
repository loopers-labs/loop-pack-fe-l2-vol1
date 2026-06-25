type TagProps = {
  /** 뱃지에 표시할 텍스트 */
  label: string;
  /** 텍스트와 테두리 색상 */
  color: string;
};

export function Tag({ label, color }: TagProps) {
  return (
    <span className="tag" style={{ color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}
