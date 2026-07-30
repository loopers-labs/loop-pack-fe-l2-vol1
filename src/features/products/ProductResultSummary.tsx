type ProductResultSummaryProps = {
  totalCount: number;
};

export function ProductResultSummary({ totalCount }: ProductResultSummaryProps) {
  return (
    <p className="mb-4 text-sm font-semibold text-gds-gray-700">
      총 <strong className="text-gds-green-700">{totalCount}</strong>개
    </p>
  );
}
