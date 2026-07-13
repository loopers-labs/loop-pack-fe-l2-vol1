type ProductResultSummaryProps = {
  totalCount: number;
};

export function ProductResultSummary({ totalCount }: ProductResultSummaryProps) {
  return <p>총 {totalCount}개</p>;
}
