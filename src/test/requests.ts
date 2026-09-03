// MSW 핸들러가 받은 요청의 조건을 기록한다.
//
// 왜 필요한가 — queryKey는 조건 객체에서, 요청 URL은 params.set()에서 **따로** 만들어진다.
// 그래서 핸들러가 호출 순서로 응답을 고르면 `params.set("sort", …)`를 지워도
// 조건이 바뀌는 순간 key가 갈려 재요청이 나가고 화면도 바뀌어 테스트가 통과한다.
// 핸들러는 요청을 읽어 응답을 고르고, 테스트는 무엇이 실렸는지 여기서 확인한다.
export function createRequestLog() {
  const entries: URLSearchParams[] = [];

  return {
    /** 핸들러 안에서 호출한다. 읽은 조건을 그대로 돌려준다. */
    record(request: Request): URLSearchParams {
      const params = new URL(request.url).searchParams;
      entries.push(params);
      return params;
    },
    get count(): number {
      return entries.length;
    },
    /** 마지막으로 나간 요청의 조건. 아직 없으면 실패로 만든다. */
    last(): URLSearchParams {
      const params = entries.at(-1);
      if (params === undefined) {
        throw new Error("요청이 아직 나가지 않았다 — 대기 조건을 먼저 확인할 것.");
      }
      return params;
    },
  };
}
