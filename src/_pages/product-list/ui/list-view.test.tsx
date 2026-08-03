import { afterEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender } from "@testing-library/react"; // 순수 RTL render만 예외로 직접 가져온다 — 결함1 회귀 테스트가 NuqsTestingAdapter를 직접 감싸 searchParams prop을 rerender로 바꿔야 하는데, 커스텀 render로는 어댑터 prop에 닿을 수 없다
import userEvent from "@testing-library/user-event";
import { http, delay, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { server } from "../../../../mocks/server";
import { cleanup, fireEvent, render, screen, within } from "../../../../mocks/render"; // render는 QueryClientProvider로 감싸는 커스텀 버전이다(ListView가 useQuery를 쓴다)
import { GET as getProducts } from "../../../../app/api/products/route";
import { ListView } from "./list-view";

afterEach(cleanup); // globals:false라 RTL 자동 cleanup이 등록되지 않는다.

// 응답을 손으로 합성하지 않고 route.ts의 시나리오 분기(scenario=error)로 위임한다 —
// 검증·정렬·페이지네이션·에러 메시지 로직은 route.ts 하나에만 존재해야 한다.
const serverErrorScenario = () =>
  server.use(
    http.get("/api/products", () =>
      getProducts(new NextRequest("http://localhost:3000/api/products?scenario=error")),
    ),
  );

const clientErrorScenario = () =>
  server.use(
    http.get("/api/products", () =>
      HttpResponse.json({ message: "요청 조건을 확인해주세요." }, { status: 400 }),
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
    it("4xx 오류에서는 상품 목록 인라인 문구와 재시도 버튼을 내고 필터바를 유지한다", async () => {
      clientErrorScenario();

      render(<ListView />);

      expect(await screen.findByText("상품 목록을 불러오지 못했습니다")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "재시도" })).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeEnabled();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    it("5xx 오류를 인라인으로 처리하지 않고 렌더 오류 fallback으로 전파한다", async () => {
      serverErrorScenario();

      render(<ListView />, { withErrorBoundary: true });

      expect(await screen.findByRole("alert", { name: "렌더 오류" })).toBeInTheDocument();
      expect(screen.queryByText("상품 목록을 불러오지 못했습니다")).toBeNull();
    });

    it("네트워크 전송 실패를 인라인으로 처리하지 않고 렌더 오류 fallback으로 전파한다", async () => {
      server.use(http.get("/api/products", () => HttpResponse.error()));

      render(<ListView />, { withErrorBoundary: true });

      expect(await screen.findByRole("alert", { name: "렌더 오류" })).toBeInTheDocument();
      expect(screen.queryByText("상품 목록을 불러오지 못했습니다")).toBeNull();
    });

    it("재시도 클릭이 refetch를 트리거해 성공 화면으로 전환된다", async () => {
      clientErrorScenario();

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

  describe("범위 초과 복구 버튼이 실제로 1페이지 결과를 렌더한다 (L3-a)", () => {
    it("C1: 1페이지로 이동 버튼을 클릭하면 카드가 렌더되고 범위 초과 문구가 사라진다", async () => {
      const user = userEvent.setup();
      render(<ListView />, { searchParams: "?q=스탠리&page=2" });

      await screen.findByRole("button", { name: "1페이지로 이동" });

      await user.click(screen.getByRole("button", { name: "1페이지로 이동" }));

      expect(await screen.findAllByRole("article")).toHaveLength(4);
      expect(screen.queryByText("이 페이지에는 상품이 없습니다")).toBeNull();
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
      clientErrorScenario();

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

    it("D1: page=2에서는 aria-current가 2페이지 버튼에만 붙는다 (L3-b)", async () => {
      render(<ListView />, { searchParams: "?page=2" });

      await screen.findByText("총 30개");

      const nav = screen.getByRole("navigation", { name: "페이지 이동" });
      expect(within(nav).getByRole("button", { name: "2페이지" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(within(nav).getByRole("button", { name: "1페이지" })).not.toHaveAttribute(
        "aria-current",
      );
      expect(within(nav).getByRole("button", { name: "3페이지" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("D2: page=3에서는 aria-current가 3페이지 버튼에만 붙는다 (L3-b)", async () => {
      render(<ListView />, { searchParams: "?page=3" });

      await screen.findByText("총 30개");

      const nav = screen.getByRole("navigation", { name: "페이지 이동" });
      expect(within(nav).getByRole("button", { name: "3페이지" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(within(nav).getByRole("button", { name: "1페이지" })).not.toHaveAttribute(
        "aria-current",
      );
      expect(within(nav).getByRole("button", { name: "2페이지" })).not.toHaveAttribute(
        "aria-current",
      );
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

    describe("no-op 가드 — 병합 결과가 현재 query와 같으면 history를 쓰지 않는다 (C4 no-op)", () => {
      it("A1: 현재 페이지 버튼(2페이지)을 3회 클릭해도 onUrlUpdate가 0회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: "?page=2", onUrlUpdate });
        await screen.findByText("총 30개");

        const nav = screen.getByRole("navigation", { name: "페이지 이동" });
        const currentPageButton = within(nav).getByRole("button", { name: "2페이지" });

        await user.click(currentPageButton);
        await user.click(currentPageButton);
        await user.click(currentPageButton);

        expect(onUrlUpdate).not.toHaveBeenCalled();
      });

      it("A2: 같은 검색어(shirt)로 3회 제출해도 onUrlUpdate가 0회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: "?q=shirt", onUrlUpdate });
        await screen.findByText(/^총 /);

        const searchInput = screen.getByLabelText("검색");
        await user.type(searchInput, "{Enter}");
        await user.type(searchInput, "{Enter}");
        await user.type(searchInput, "{Enter}");

        expect(onUrlUpdate).not.toHaveBeenCalled();
      });

      it("A3: (회귀 가드) 다른 페이지 버튼(3페이지) 클릭은 onUrlUpdate가 1회다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: "?page=2", onUrlUpdate });
        await screen.findByText("총 30개");

        const nav = screen.getByRole("navigation", { name: "페이지 이동" });
        await user.click(within(nav).getByRole("button", { name: "3페이지" }));

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
      });

      it("A4: 기본 URL(쿼리 없음)에서 카테고리를 이미 선택된 값(전체)으로 change해도 onUrlUpdate가 0회다", async () => {
        // <select>에서 이미 선택된 값을 다시 골라도 happy-dom(user-event)은 change를
        // 발생시킨다(실측 확인: 가드를 무력화하면 이 케이스가 실패로 바뀐다) — 그래서
        // 대표 케이스가 성립한다. 병합 결과(카테고리 동일 + page 리셋 후 1)가 현재
        // query(all·1)와 같아야만 여기서 막히므로, 바뀐 필드만 비교하는 얕은 가드로는
        // 못 잡고 병합 후 4필드 전체 비교가 필요함을 보여준다.
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        await user.selectOptions(screen.getByLabelText("카테고리"), "all");

        expect(onUrlUpdate).not.toHaveBeenCalled();
      });

      it("A5: (교차 케이스) 2페이지에서 같은 검색어(shirt)를 그대로 재제출해도 page가 1로 리셋된다 — 제출은 언제나 1페이지부터 시작하는 게 의도된 동작이라 no-op이 아니다", async () => {
        // A2와 대칭인 케이스다: A2는 page가 이미 1이라 재제출해도 병합 결과가
        // 현재 query와 같아 no-op 가드에 걸린다. 여기는 page가 2라 q는 안
        // 바꿔도 page:1 리셋(use-list-query.ts의 키 존재 판정, C9b) 때문에
        // 병합 결과가 현재 query(page=2)와 달라지므로 no-op 가드를 통과하고
        // onUrlUpdate가 1회 나가야 한다. 이걸 버그로 오인해 no-op 처리로
        // "고치면" 안 된다 — 같은 검색어를 다시 제출했는데 5페이지에 그대로
        // 머무는 쪽이 오히려 제출의 의미를 흐리는 회귀다.
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { searchParams: "?q=shirt&page=2", onUrlUpdate });
        await screen.findByText(/^총 /);

        const searchInput = screen.getByLabelText("검색");
        await user.click(searchInput);
        await user.type(searchInput, "{Enter}");

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const { searchParams } = onUrlUpdate.mock.calls[0][0];
        expect(searchParams.has("page")).toBe(false);
        expect(searchParams.get("q")).toBe("shirt");
      });
    });

    describe("검색 조건 전체 초기화", () => {
      it("비기본 검색 조건에서 전체 초기화를 누르면 기본 컨트롤로 복원하고 history push를 1회 쓴다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, {
          searchParams: "?q=스탠리&category=home&sort=price-asc&page=2",
          onUrlUpdate,
        });
        await screen.findByText(/^총 /);

        await user.click(screen.getByRole("button", { name: "전체 초기화" }));

        expect(onUrlUpdate).toHaveBeenCalledTimes(1);
        const event = onUrlUpdate.mock.calls[0][0];
        expect(event.options.history).toBe("push");
        expect(event.searchParams.has("q")).toBe(false);
        expect(event.searchParams.has("category")).toBe(false);
        expect(event.searchParams.has("sort")).toBe(false);
        expect(event.searchParams.has("page")).toBe(false);
        expect(screen.getByLabelText("검색")).toHaveValue("");
        expect(screen.getByLabelText("카테고리")).toHaveValue("all");
        expect(screen.getByLabelText("정렬")).toHaveValue("latest");

        const nav = await screen.findByRole("navigation", { name: "페이지 이동" });
        expect(within(nav).getByRole("button", { current: "page" })).toHaveAccessibleName(
          "1페이지",
        );
      });

      it("기본 URL에서 전체 초기화를 눌러도 URL을 쓰지 않는다", async () => {
        const onUrlUpdate = vi.fn();
        const user = userEvent.setup();
        render(<ListView />, { onUrlUpdate });
        await screen.findByText("총 30개");

        await user.click(screen.getByRole("button", { name: "전체 초기화" }));

        expect(onUrlUpdate).not.toHaveBeenCalled();
      });

      it("소유하지 않는 query만 있는 URL에서는 전체 초기화가 history를 쓰지 않는다", async () => {
        const previousUrl = window.location.href;
        window.history.replaceState({}, "", "/products?utm_source=campaign");

        try {
          const onUrlUpdate = vi.fn();
          const user = userEvent.setup();
          render(<ListView />, { searchParams: "?utm_source=campaign", onUrlUpdate });
          await screen.findByText("총 30개");

          await user.click(screen.getByRole("button", { name: "전체 초기화" }));

          expect(onUrlUpdate).not.toHaveBeenCalled();
        } finally {
          window.history.replaceState({}, "", previousUrl);
        }
      });

      it("파싱 결과가 기본값이어도 비정상 URL에서 전체 초기화를 누르면 canonical 기본 URL로 정규화한다", async () => {
        const previousUrl = window.location.href;
        window.history.replaceState({}, "", "/products?category=bogus&page=0");

        try {
          const onUrlUpdate = vi.fn();
          const user = userEvent.setup();
          render(<ListView />, {
            searchParams: "?category=bogus&page=0",
            onUrlUpdate,
          });
          await screen.findByText("총 30개");

          await user.click(screen.getByRole("button", { name: "전체 초기화" }));

          expect(onUrlUpdate).toHaveBeenCalledTimes(1);
          const { searchParams } = onUrlUpdate.mock.calls[0][0];
          expect(searchParams.has("category")).toBe(false);
          expect(searchParams.has("page")).toBe(false);
        } finally {
          window.history.replaceState({}, "", previousUrl);
        }
      });

      it("제출하지 않은 검색어를 입력한 뒤 전체 초기화를 누르면 검색 입력도 비운다", async () => {
        const user = userEvent.setup();
        render(<ListView />);
        await screen.findByText("총 30개");

        const searchInput = screen.getByLabelText("검색");
        await user.type(searchInput, "미제출 검색어");
        expect(searchInput).toHaveValue("미제출 검색어");

        await user.click(screen.getByRole("button", { name: "전체 초기화" }));

        expect(screen.getByLabelText("검색")).toHaveValue("");
      });
    });

    describe("검색 제출 후 포커스가 유지된다 — key 리마운트에도 살아남는 포커스 복원 (C5)", () => {
      it("B1: 최초 렌더 직후에는 검색 입력이 포커스를 훔치지 않는다", async () => {
        render(<ListView />);
        await screen.findByText("총 30개");

        expect(document.activeElement).not.toBe(screen.getByLabelText("검색"));
      });

      it("B2: 검색 입력에 포커스 후 제출하면 제출 후에도 검색 입력이 포커스를 유지한다", async () => {
        const user = userEvent.setup();
        render(<ListView />);
        await screen.findByText("총 30개");

        const searchInput = screen.getByLabelText("검색");
        await user.click(searchInput);
        await user.type(searchInput, "스탠리{Enter}");

        expect(document.activeElement).toBe(screen.getByLabelText("검색"));
      });

      it("B3: (회귀 가드) 제출 전후로 검색 입력 DOM 노드 자체는 교체된다 — key 리마운트가 유지됨을 확인한다(C22 보호)", async () => {
        const user = userEvent.setup();
        render(<ListView />);
        await screen.findByText("총 30개");

        const searchInputBeforeSubmit = screen.getByLabelText("검색");
        await user.click(searchInputBeforeSubmit);
        await user.type(searchInputBeforeSubmit, "스탠리{Enter}");

        const searchInputAfterSubmit = screen.getByLabelText("검색");
        expect(searchInputAfterSubmit).not.toBe(searchInputBeforeSubmit);
      });

      it("결함1 회귀: 같은 검색어 재제출(no-op) 후 폼 바깥에서 온 q 변경(뒤로가기)이 사용자가 제출하지 않았는데 검색창 포커스를 훔치지 않는다", async () => {
        const user = userEvent.setup();
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        // mocks/render의 rerender는 원래 감싸는 Provider 없이 바로 새 엘리먼트로
        // 리렌더하므로 NuqsTestingAdapter의 searchParams prop을 바꿀 수 없다 — 여기서만
        // 직접 감싸 렌더한다. hasMemory:true 아래서도 adapters/testing.js의 useEffect가
        // [hasMemory, renderedInitialSearchParams]에 걸려 있어, searchParams prop이
        // 바뀌면(=폼 바깥에서 온 URL 변경, 예: 브라우저 뒤로가기) 내부 상태를 그 값으로
        // 재동기화한다 — 이걸로 "폼 바깥에서 온 q 변경"을 흉내 낸다.
        const tree = (searchParams: string) => (
          <QueryClientProvider client={queryClient}>
            <NuqsTestingAdapter hasMemory searchParams={searchParams}>
              <ListView />
            </NuqsTestingAdapter>
          </QueryClientProvider>
        );

        const { rerender } = rtlRender(tree("?q=shirt"));
        await screen.findByText(/^총 /);

        // 같은 검색어("shirt")로 재제출 — no-op이라 URL도 안 바뀌고 SearchInput도
        // 리마운트되지 않는다. 고친 코드는 이 제출에서 플래그를 켜지 않는다.
        await user.type(screen.getByLabelText("검색"), "{Enter}");

        // 사용자가 검색창을 떠난다.
        screen.getByLabelText("검색").blur();
        expect(document.activeElement).not.toBe(screen.getByLabelText("검색"));

        // 폼 바깥에서 q가 되돌아온다(뒤로가기) — SearchInput이 key={query.q} 때문에
        // 리마운트된다.
        rerender(tree(""));
        await screen.findByText(/^총 /);

        // 사용자가 아무것도 제출하지 않았는데 포커스가 검색창으로 끌려가면 결함이
        // 재현된 것이다.
        expect(document.activeElement).not.toBe(screen.getByLabelText("검색"));
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
      // latest가 클라이언트 기본값이라 latest에서 시작해 latest를 다시 고르면
      // 정렬 결과가 그대로라 첫 카드 변화를 관찰할 수 없다 — 그래서 latest를 마지막에 복귀시킨다.
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
