type SelectProps<T extends string> = {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
};

export function Select<T extends string>({
  value,
  options,
  labels,
  onChange,
}: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const selected = options.find((option) => option === e.target.value);
        if (selected !== undefined) onChange(selected);
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option]}
        </option>
      ))}
    </select>
  );
}
