export const FilterGroupShell = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="filter-group">
      <label>{label}</label>
      {children}
    </div>
  );
};
