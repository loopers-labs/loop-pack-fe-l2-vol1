export const Dropdown = ({
  value,
  onOptionChange,
  options,
}: {
  value: string;
  onOptionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) => {
  return (
    <select value={value} onChange={onOptionChange}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
