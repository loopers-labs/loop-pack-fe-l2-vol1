import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, delay } from "msw";
import { NextRequest } from "next/server";
import { server } from "../../mocks/server";
import { render } from "../../mocks/render"; // RTL render가 아니라 이걸 쓴다(QueryClientProvider 필요)
import { GET as getProducts } from "../../app/api/products/route";
import { useCommerceStore } from "./store";
import { ListView } from "./list-view";

afterEach(cleanup); // globals:false라 RTL 자동 cleanup이 등록되지 않는다.
beforeEach(() => {
  useCommerceStore.setState({ cartIds: new Set(), wishlistIds: new Set() }); // 카드가 store를 구독하므로 격리한다
});

// 응답을 손으로 합성하지 않고 route.ts의 시나리오 분기(scenario=error)로 위임한다 —
// 검증·정렬·페이지네이션·에러 메시지 로직은 route.ts 하나에만 존재해야 한다.
const errorScenario = () =>
  server.use(
    http.get("/api/products", () =>
      getProducts(new NextRequest("http://localhost:3000/api/products?scenario=error")),
    ),
  );

// 실제 요청 URL 그대로 route.ts에 위임한다 — mocks/handlers.ts의 기본 위임과 동일한 형태.
const successScenario = () =>
  server.use(http.get("/api/products", ({ request }) => getProducts(new NextRequest(request.url))));

const pendingScenario = () =>
  server.use(
    http.get("/api/products", async () => {
      await delay("infinite");
    }),
  );

describe("ListView", () => {
  describe("로딩 (F1)", () => {
    it("pending 상태에서 aria-busy 스켈레톤 12개를 낸다", () => {
      pendingScenario();

      render(<ListView />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-busy", "true");
      expect(status.children).toHaveLength(12);
    });
  });

  describe("에러 (F2)", () => {
    it("에러 상태에서 상품 목록을 불러오지 못했습니다 문구와 재시도 버튼을 낸다", async () => {
      errorScenario();

      render(<ListView />);

      expect(await screen.findByText("상품 목록을 불러오지 못했습니다")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "재시도" })).toBeInTheDocument();
    });

    it("재시도 클릭이 refetch를 트리거해 성공 화면으로 전환된다", async () => {
      errorScenario();

      render(<ListView />);

      const retryButton = await screen.findByRole("button", { name: "재시도" });

      successScenario();
      fireEvent.click(retryButton);

      expect(await screen.findByText("총 30개")).toBeInTheDocument();
    });
  });

  describe("빈 상태 문구 (F3·F4 대조쌍)", () => {
    it("검색 조건에 걸리는 상품이 없으면 검색 결과가 없습니다만 뜨고 페이지 이동 문구는 없다", async () => {
      render(<ListView />, { searchParams: "?q=존재하지않는검색어" });

      expect(await screen.findByText("검색 결과가 없습니다")).toBeInTheDocument();
      expect(screen.queryByText("이 페이지에는 상품이 없습니다")).toBeNull();
    });

    it("검색 결과는 있지만 페이지가 범위를 벗어나면 페이지 이동 문구만 뜨고 검색 결과가 없습니다는 없다", async () => {
      render(<ListView />, { searchParams: "?q=스탠리&page=2" });

      expect(await screen.findByText("이 페이지에는 상품이 없습니다")).toBeInTheDocument();
      expect(screen.getByText("총 4개")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "1페이지로 이동" })).toBeInTheDocument();
      expect(screen.queryByText("검색 결과가 없습니다")).toBeNull();
    });
  });

  describe("총 개수·필터바 (F5·F5b, 다섯 분기 각각 유도)", () => {
    it("pending에는 총 개수가 없고, 필터바는 여전히 활성 상태로 마운트되어 있다", () => {
      pendingScenario();

      render(<ListView />);

      expect(screen.queryByText(/^총 /)).toBeNull();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      for (const combobox of screen.getAllByRole("combobox")) {
        expect(combobox).toBeEnabled();
      }
    });

    it("error에는 총 개수가 없고, 필터바는 여전히 활성 상태로 마운트되어 있다", async () => {
      errorScenario();

      render(<ListView />);

      await screen.findByRole("button", { name: "재시도" });

      expect(screen.queryByText(/^총 /)).toBeNull();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      for (const combobox of screen.getAllByRole("combobox")) {
        expect(combobox).toBeEnabled();
      }
    });

    it("success에는 총 개수가 있고, 필터바는 활성 상태다", async () => {
      render(<ListView />);

      expect(await screen.findByText("총 30개")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      for (const combobox of screen.getAllByRole("combobox")) {
        expect(combobox).toBeEnabled();
      }
    });

    it("empty(검색 결과 없음)에도 총 개수가 있고, 필터바는 활성 상태다", async () => {
      render(<ListView />, { searchParams: "?q=존재하지않는검색어" });

      expect(await screen.findByText("총 0개")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      for (const combobox of screen.getAllByRole("combobox")) {
        expect(combobox).toBeEnabled();
      }
    });

    it("범위 초과 페이지에도 총 개수가 있고, 필터바는 활성 상태다", async () => {
      render(<ListView />, { searchParams: "?q=스탠리&page=2" });

      expect(await screen.findByText("총 4개")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      for (const combobox of screen.getAllByRole("combobox")) {
        expect(combobox).toBeEnabled();
      }
    });
  });

  describe("페이지네이션 (F6·F7 대조쌍)", () => {
    it("페이지 여러 개면 nav 안에 현재 페이지가 aria-current로 표시된다", async () => {
      render(<ListView />);

      await screen.findByText("총 30개");

      const nav = screen.getByRole("navigation", { name: "페이지 이동" });
      expect(within(nav).getByRole("button", { current: "page" })).toBeInTheDocument();
    });

    it("페이지가 1개뿐이면 nav 자체가 렌더되지 않는다", async () => {
      render(<ListView />, { searchParams: "?category=digital" });

      await screen.findByText("총 6개");

      expect(screen.queryByRole("navigation", { name: "페이지 이동" })).toBeNull();
    });
  });

  describe("URL 파라미터 (C4~C16)", () => {
    describe("컨트롤 조작이 history push 이벤트를 정확히 1회 낸다 (C4·C5)", () => {
      // 네 컨트롤을 한 렌더에서 순차 조작하면 안 된다 — hasMemory:true라 조작이 실제로
      // 반영되고, 카테고리를 페이지보다 먼저 바꾸면 총 6건·1페이지가 되어 F7에 따라
      // nav가 사라진다(누를 페이지 버튼이 없어짐). 파라미터마다 렌더를 새로 만든다.
      it("C4·C5: 검색어 변경이 history push고 이벤트가 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        await user.type(screen.getByLabelText("검색"), "스탠리{Enter}");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const event = onUrlUpdate.mock.calls[0][0];
        expect(event.options.history).toBe("push");
      });

      it("C4·C5: 카테고리 변경이 history push고 이벤트가 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        await user.selectOptions(screen.getByLabelText("카테고리"), "digital");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const event = onUrlUpdate.mock.calls[0][0];
        expect(event.options.history).toBe("push");
      });

      it("C4·C5: 정렬 변경이 history push고 이벤트가 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        await user.selectOptions(screen.getByLabelText("정렬"), "popular");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const event = onUrlUpdate.mock.calls[0][0];
        expect(event.options.history).toBe("push");
      });

      it("C4·C5: 페이지 변경이 history push고 이벤트가 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        // page의 push를 확인하려면 nav가 렌더된 상태여야 하므로 쿼리 없는 기본
        // /products에서 출발한다(실측 30건·3페이지).
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        const nav = screen.getByRole("navigation", { name: "페이지 이동" });
        await user.click(within(nav).getByRole("button", { name: "2페이지" }));

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const event = onUrlUpdate.mock.calls[0][0];
        expect(event.options.history).toBe("push");
      });
    });

    describe("조건 변경 시 page 키가 사라지고 나머지는 보존된다 (C6·C7·C8)", () => {
      const INITIAL_QUERY = "?q=코트&category=home&sort=price-asc&page=3";

      it("C6: 검색어를 바꾸면 page 키가 사라지고 category·sort는 보존된다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: INITIAL_QUERY, onUrlUpdate });
        await screen.findByText(/^총 /);

        const searchInput = screen.getByLabelText("검색");
        // draft가 useState(initialQ)로 controlled라 clear() 없이 입력하면
        // '코트'에 이어붙어 '코트스탠리'가 된다.
        await user.clear(searchInput);
        await user.type(searchInput, "스탠리{Enter}");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const { searchParams } = onUrlUpdate.mock.calls[0][0];
        expect(searchParams.has("page")).toBe(false);
        expect(searchParams.get("q")).toBe("스탠리");
        expect(searchParams.get("category")).toBe("home");
        expect(searchParams.get("sort")).toBe("price-asc");
      });

      it("C7: 카테고리를 바꾸면 page 키가 사라지고 q·sort는 보존된다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: INITIAL_QUERY, onUrlUpdate });
        await screen.findByText(/^총 /);

        await user.selectOptions(screen.getByLabelText("카테고리"), "digital");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const { searchParams } = onUrlUpdate.mock.calls[0][0];
        expect(searchParams.has("page")).toBe(false);
        expect(searchParams.get("category")).toBe("digital");
        expect(searchParams.get("q")).toBe("코트");
        expect(searchParams.get("sort")).toBe("price-asc");
      });

      it("C8: 정렬을 바꾸면 page 키가 사라지고 q·category는 보존된다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: INITIAL_QUERY, onUrlUpdate });
        await screen.findByText(/^총 /);

        await user.selectOptions(screen.getByLabelText("정렬"), "popular");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const { searchParams } = onUrlUpdate.mock.calls[0][0];
        expect(searchParams.has("page")).toBe(false);
        expect(searchParams.get("sort")).toBe("popular");
        expect(searchParams.get("q")).toBe("코트");
        expect(searchParams.get("category")).toBe("home");
      });
    });

    describe("페이지 변경 시 다른 조건은 보존된다 (C9)", () => {
      it("C9: 페이지네이션 클릭이 page를 추가하고 q·sort를 보존하며 category 키는 계속 없다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        // 실측 24건·2페이지. category는 기본값(all)이라 보존 대상에 넣을 수 없다 —
        // 카테고리 5종이 전부 6건이라 pageSize=12에서 항상 1페이지고, F7에 따라
        // nav 자체가 렌더되지 않아 누를 페이지 버튼이 없다.
        render(<ListView />, { searchParams: "?q=e&sort=price-asc", onUrlUpdate });
        await screen.findByText("총 24개");

        const nav = screen.getByRole("navigation", { name: "페이지 이동" });
        await user.click(within(nav).getByRole("button", { name: "2페이지" }));

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const { searchParams } = onUrlUpdate.mock.calls[0][0];
        expect(searchParams.get("page")).toBe("2");
        expect(searchParams.get("q")).toBe("e");
        expect(searchParams.get("sort")).toBe("price-asc");
        expect(searchParams.has("category")).toBe(false);
      });
    });

    describe("입력 중에는 URL이 바뀌지 않는다 (C10)", () => {
      it("C10: 타이핑만 하면 onUrlUpdate가 0회고, 제출해야만 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        const searchInput = screen.getByLabelText("검색");
        await user.type(searchInput, "스탠리");
        expect(onUrlUpdate).not.toHaveBeenCalled();

        await user.type(searchInput, "{Enter}");
        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
      });
    });

    describe("클라이언트가 5필드만 재직렬화한다 — 재직렬화 계약 (C11~C16)", () => {
      // MSW Life-cycle events API로 /api/products 요청의 쿼리·상태코드를 캡처한다.
      // docs/testing/test-layers.md:66·84 — 관찰 가능한 DOM이 있으므로 DOM을 먼저
      // 단정하고, 요청 캡처는 추가분으로 그 다음에 확인한다.
      type CapturedRequest = { search: string; status: number };

      function captureProductRequests(): CapturedRequest[] {
        const requests: CapturedRequest[] = [];
        server.events.on("response:mocked", ({ request, response }) => {
          const url = new URL(request.url);
          if (url.pathname === "/api/products") {
            requests.push({ search: url.search, status: response.status });
          }
        });
        return requests;
      }

      afterEach(() => {
        server.events.removeAllListeners(); // 정리하지 않으면 스위트 간에 리스너가 새어 나간다.
      });

      it("C11: sort 파라미터가 없으면 첫 카드는 최신순 기준이고 요청엔 sort=latest가 명시된다", async () => {
        const requests = captureProductRequests();

        render(<ListView />);

        // sort 생략 시 라우트가 sort=null(카탈로그 원본 순서) 분기로 가 첫 카드가
        // catalog.ts:43의 p1이 된다 — 클라이언트는 withDefault 때문에 sort를 생략할
        // 수 없어 latest를 명시해야 한다. DOM이 그 차이를 실측으로 가른다.
        const [firstArticle] = await screen.findAllByRole("article");
        expect(within(firstArticle).getByRole("heading", { level: 3 })).toHaveTextContent(
          "Margaret Sweatshirt - Oatmeal",
        );

        expect(requests.at(-1)?.search).toContain("sort=latest");
      });

      it("C12: sort=bogus여도 첫 카드는 최신순 기준이고 요청엔 sort=latest가 명시된다", async () => {
        const requests = captureProductRequests();

        render(<ListView />, { searchParams: "?sort=bogus" });

        const [firstArticle] = await screen.findAllByRole("article");
        expect(within(firstArticle).getByRole("heading", { level: 3 })).toHaveTextContent(
          "Margaret Sweatshirt - Oatmeal",
        );

        expect(requests.at(-1)?.search).toContain("sort=latest");
      });

      it("C13: category=bogus는 전체 카테고리로 되돌아가고 요청은 200이다", async () => {
        const requests = captureProductRequests();

        render(<ListView />, { searchParams: "?category=bogus" });

        expect(await screen.findByText("총 30개")).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(12);

        const last = requests.at(-1);
        expect(last?.search).toContain("category=all");
        expect(last?.status).toBe(200);
      });

      it("C14: page=0은 1페이지로 클램프되고 요청은 400이 아니다", async () => {
        const requests = captureProductRequests();

        render(<ListView />, { searchParams: "?page=0" });

        expect(await screen.findByText("총 30개")).toBeInTheDocument();
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(12);
        expect(within(articles[0]).getByRole("heading", { level: 3 })).toHaveTextContent(
          "Margaret Sweatshirt - Oatmeal",
        );

        const last = requests.at(-1);
        expect(last?.search).toContain("page=1");
        expect(last?.status).not.toBe(400);
      });

      it("C15: page=-1은 1페이지로 클램프된다", async () => {
        const requests = captureProductRequests();

        render(<ListView />, { searchParams: "?page=-1" });

        expect(await screen.findByText("총 30개")).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(12);

        expect(requests.at(-1)?.search).toContain("page=1");
      });

      it("C16: page=01은 1페이지로 클램프되고 요청은 200이다", async () => {
        const requests = captureProductRequests();

        render(<ListView />, { searchParams: "?page=01" });

        expect(await screen.findByText("총 30개")).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(12);

        const last = requests.at(-1);
        expect(last?.search).toContain("page=1");
        expect(last?.status).toBe(200);
      });
    });
  });

  describe("정렬 조작 (F8)", () => {
    it("F8: 정렬을 인기순→낮은가격순→높은가격순→최신순 순서로 바꾸면 각 단계 첫 카드가 갱신된다", async () => {
      const user = userEvent.setup();
      // latest가 클라이언트 기본값이라 latest에서 시작해 latest로 change하면
      // change 이벤트가 발생하지 않는다 — 그래서 latest를 마지막에 복귀시킨다.
      render(<ListView />);
      await screen.findByText("총 30개");

      const sortSelect = screen.getByLabelText("정렬");

      await user.selectOptions(sortSelect, "popular");
      const [popularFirst] = await screen.findAllByRole("article");
      expect(within(popularFirst).getByRole("heading", { level: 3 })).toHaveTextContent(
        "메이커스 투명케이스",
      );

      await user.selectOptions(sortSelect, "price-asc");
      const [priceAscFirst] = await screen.findAllByRole("article");
      expect(within(priceAscFirst).getByRole("heading", { level: 3 })).toHaveTextContent(
        "WOOD GLOVES",
      );

      await user.selectOptions(sortSelect, "price-desc");
      const [priceDescFirst] = await screen.findAllByRole("article");
      expect(within(priceDescFirst).getByRole("heading", { level: 3 })).toHaveTextContent(
        "23AW Voyager Balmacaan Coat (Dark Navy)",
      );

      // 4단계(latest 복귀)는 TanStack 캐시 히트라 새 요청이 없다 — DOM으로만 단정한다.
      await user.selectOptions(sortSelect, "latest");
      const [latestFirst] = await screen.findAllByRole("article");
      expect(within(latestFirst).getByRole("heading", { level: 3 })).toHaveTextContent(
        "Margaret Sweatshirt - Oatmeal",
      );
    });
  });

  describe("네 컨트롤이 각각 독립으로 URL과 렌더 결과를 바꾼다 (F9)", () => {
    // 정렬은 F8이 커버하므로 여기서는 검색·카테고리·페이지만 다룬다.
    it("F9: 검색 컨트롤이 결과를 4건으로 좁힌다", async () => {
      const user = userEvent.setup();
      render(<ListView />);
      await screen.findByText("총 30개");

      await user.type(screen.getByLabelText("검색"), "스탠리{Enter}");

      expect(await screen.findByText("총 4개")).toBeInTheDocument();
    });

    it("F9: 카테고리 컨트롤이 6건·1페이지로 좁히고 nav를 없앤다", async () => {
      const user = userEvent.setup();
      render(<ListView />);
      await screen.findByText("총 30개");

      await user.selectOptions(screen.getByLabelText("카테고리"), "digital");

      expect(await screen.findByText("총 6개")).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "페이지 이동" })).toBeNull();
    });

    it("F9: 페이지 컨트롤은 총 개수(30개)는 그대로 두고 렌더 카드 수만 12에서 6으로 바꾼다", async () => {
      const user = userEvent.setup();
      render(<ListView />);
      await screen.findByText("총 30개");
      expect(screen.getAllByRole("article")).toHaveLength(12);

      const nav = screen.getByRole("navigation", { name: "페이지 이동" });
      await user.click(within(nav).getByRole("button", { name: "3페이지" }));

      const thirdPageFirstHeading = await screen.findByRole("heading", {
        level: 3,
        name: "[STANLEY] 스탠리 클래식 진공 캠프머그 473미리",
      });
      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(6);
      expect(articles[0]).toContainElement(thirdPageFirstHeading);
      expect(screen.getByText("총 30개")).toBeInTheDocument();
    });
  });
});
