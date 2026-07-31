const NEW_WITHIN_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 등록일이 최근 NEW_WITHIN_DAYS(한 달) 이내면 신상품으로 본다. now 를 주입받아 테스트에서 시간을 고정한다.
// 잘못된 날짜는 Date.parse 가 NaN → elapsed 가 NaN → 아래 비교가 false 라 자연히 걸러진다.
export function isNewProduct(
  createdAt: string,
  now: Date = new Date(),
): boolean {
  const elapsed = now.getTime() - Date.parse(createdAt);

  return elapsed >= 0 && elapsed <= NEW_WITHIN_DAYS * MS_PER_DAY;
}
