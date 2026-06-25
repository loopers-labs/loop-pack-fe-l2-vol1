export type Address = {
  id: string;
  label: string; // "집", "회사"
  recipient: string;
  detail: string;
  isRemote: boolean; // 도서산간 → 배송비 추가
};
