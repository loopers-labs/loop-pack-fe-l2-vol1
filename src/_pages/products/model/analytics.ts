import { track } from "@/shared/analytics";

// 목록 페이지가 소유한 이벤트. 화면에 표시된 조회 조건을 props 로 싣는다.
export function trackProductListView(props: {
  category: string;
  sort: string;
  page: number;
}): void {
  track("product_list_view", { props });
}
