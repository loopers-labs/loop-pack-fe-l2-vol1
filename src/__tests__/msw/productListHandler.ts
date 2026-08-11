import { http, HttpResponse } from "msw";
import type { ProductListResponse } from "@/entities/product/api/fetchProducts";
import { PRODUCTS_ENDPOINT } from "./handlers";
import { server } from "./server";

/**
 * 이게 없으면 못 하는 것: "요청이 실제로 나갔는지 · 몇 번 · 무슨 조건으로"를 단언하는 것.
 * MSW 는 응답만 가짜로 줄 뿐 나간 요청의 로그를 주지 않는다
 * 그래서 나간 요청을 보기 위해 핸들러 안에서 요청을 직접 배열에 담은 기록 배열을 만들어 돌려준다.
 * 이게 없으면 테스트는 결과 화면·데이터만 볼 수 있고 "요청 자체"는 못 본다.
 *
 *  - `respond` 인자            = 무슨 데이터를 돌려줄지 (예전 `mockResolvedValue` 역할)
 *  - 반환 `URLSearchParams[]`   = 도착한 요청들의 쿼리 로그 (예전 `mock.calls` 역할)
 *
 * 주의: 이 "요청 관찰"(몇 번·무슨 조건으로 나갔나)은 사용자에게 보이지 않는 구현 세부에 가까움
 * 0단계에선 기존 테스트 의미만 유지했고, 이후 단계에서 더 디테일하게 검토해 사용자 행위로 다시 쓸지·그대로 둘지·필요 없으면 제거할지 정한다.
 */
export function installProductListHandler(
  respond: (
    search: URLSearchParams,
  ) => ProductListResponse | Promise<ProductListResponse>,
): URLSearchParams[] {
  const requests: URLSearchParams[] = [];

  server.use(
    http.get(PRODUCTS_ENDPOINT, async ({ request }) => {
      const search = new URL(request.url).searchParams;
      requests.push(search);

      return HttpResponse.json(await respond(search));
    }),
  );

  return requests;
}
