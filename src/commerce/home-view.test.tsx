import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, delay, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "../../mocks/server";
import { cleanup, fireEvent, render, screen } from "../../mocks/render"; // render는 QueryClientProvider로 감싸는 커스텀 버전이다(HomeView가 useQuery를 쓴다)
import { GET as getHome } from "../../app/api/home/route";
import { useCommerceStore } from "./store";
import { getHomeData } from "./api/home";
import { HomeView } from "./home-view";

afterEach(cleanup); // globals:false라 RTL 자동 cleanup이 등록되지 않는다.
beforeEach(() => {
  useCommerceStore.setState({ cartIds: new Set(), wishlistIds: new Set() }); // 카드가 store를 구독하므로 격리한다
});

const CATEGORY_CHIPS = [
  { name: "캐주얼", id: "casual" },
  { name: "패션", id: "fashion" },
  { name: "뷰티·잡화", id: "goods" },
  { name: "홈", id: "home" },
  { name: "디지털", id: "digital" },
];

const errorScenario = () =>
  server.use(
    http.get("/api/home", () =>
      getHome(new NextRequest("http://localhost:3000/api/home?scenario=error")),
    ),
  );

const emptyScenario = () =>
  server.use(
    http.get("/api/home", () =>
      getHome(new NextRequest("http://localhost:3000/api/home?scenario=empty")),
    ),
  );

// 실제 요청 URL 그대로 route.ts에 위임한다 — list-view.test.tsx의 successScenario와 동일한 형태.
const successScenario = () =>
  server.use(http.get("/api/home", ({ request }) => getHome(new NextRequest(request.url))));

describe("HomeView", () => {
  it("pending 상태에서 aria-busy 스켈레톤을 낸다", () => {
    server.use(
      http.get("/api/home", async () => {
        await delay("infinite");
      }),
    );

    render(<HomeView />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("error 상태에서 홈 데이터를 불러오지 못했습니다 문구를 낸다", async () => {
    errorScenario();

    render(<HomeView />);

    expect(await screen.findByText("홈 데이터를 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("네트워크 전송 실패에서도 홈 데이터를 불러오지 못했습니다 문구를 낸다 (서버 메시지가 아니라 화면이 문구를 소유한다)", async () => {
    server.use(http.get("/api/home", () => HttpResponse.error()));

    render(<HomeView />);

    expect(await screen.findByText("홈 데이터를 불러오지 못했습니다.")).toBeInTheDocument();
  });

  it("재시도 버튼 클릭이 refetch를 트리거해 성공 화면으로 전환된다", async () => {
    errorScenario();

    render(<HomeView />);

    const retryButton = await screen.findByRole("button", { name: "재시도" });

    successScenario();
    fireEvent.click(retryButton);

    expect(
      await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" }),
    ).toBeInTheDocument();
  });

  it("success 상태에서 배너·카테고리·인기 상품·신상품 4영역이 전부 있다", async () => {
    render(<HomeView />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "카테고리" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "인기 상품" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "신상품" })).toBeInTheDocument();
  });

  it("인기 상품 카드에도 담기·찜 버튼이 aria-pressed와 함께 실려 나온다", async () => {
    render(<HomeView />);

    await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" });

    const home = getHomeData();
    const firstPopular = home.popularProducts[0];
    if (firstPopular === undefined) {
      throw new Error("픽스처에 인기 상품이 없다");
    }

    expect(screen.getByRole("button", { name: `${firstPopular.name} 장바구니` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: `${firstPopular.name} 위시리스트` })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("카테고리 칩 5개가 각각 /products?category=<id>로 링크되고, 홈 칩은 category=home이다", async () => {
    render(<HomeView />);

    await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" });

    for (const { name, id } of CATEGORY_CHIPS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        `/products?category=${id}`,
      );
    }
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/products?category=home",
    );
  });

  it("empty 시나리오에서 배너·카테고리는 유지되고 표시할 상품이 없습니다가 정확히 2회 나온다", async () => {
    emptyScenario();

    render(<HomeView />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "매일 새롭게 발견하는 취향" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "카테고리" })).toBeInTheDocument();
    expect(screen.getAllByText("표시할 상품이 없습니다")).toHaveLength(2);
  });

  it("인기 상품과 신상품 픽스처는 서로소다 (회귀 가드)", () => {
    const home = getHomeData();
    const popularIds = new Set(home.popularProducts.map((product) => product.id));
    const newIds = new Set(home.newProducts.map((product) => product.id));

    const overlap = [...popularIds].filter((id) => newIds.has(id));

    expect(overlap).toEqual([]);
  });
});
