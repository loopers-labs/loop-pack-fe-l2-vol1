import type { CSSProperties } from "react";

const mainStyle: CSSProperties = { maxWidth: 640, margin: "0 auto", padding: "64px 24px" };
const titleStyle: CSSProperties = { fontSize: 28, fontWeight: 800, marginBottom: 12 };
const leadStyle: CSSProperties = { color: "#5a6675", lineHeight: 1.7, marginBottom: 24 };
const listStyle: CSSProperties = { lineHeight: 2, color: "#18212e", paddingLeft: 18 };
const noteStyle: CSSProperties = { color: "#8794a3", marginTop: 24, fontSize: 14 };

// 5주차 스타터: 서버 데이터(mock route)·타입·이미지·deps만 심어둔 상태.
// 상태관리(TanStack Query·nuqs·Zustand)와 홈·목록 UI는 과제 본체이므로 학습자가 채운다.
export default function Home() {
  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>Commerce</h1>
      <p style={leadStyle}>
        5주차는 서버·URL·클라이언트 상태의 경계를 직접 정합니다. 아래 인프라 위에 홈·목록을
        쌓아가세요.
      </p>
      <ul style={listStyle}>
        <li>
          mock 백엔드: <code>GET /api/home</code> · <code>GET /api/products</code> (
          <code>app/api/*/route.ts</code>)
        </li>
        <li>
          도메인·데이터·타입: <code>src/commerce/</code> (배럴 <code>@/commerce</code>)
        </li>
        <li>
          제공 deps: <code>@tanstack/react-query</code> · <code>nuqs</code> · <code>zustand</code>
        </li>
        <li>
          레이아웃 예시: <code>src/examples/week-05-layout/</code> · 과제 명세:{" "}
          <code>docs/assignments/week-05.md</code>
        </li>
        <li>
          4주차 옵션 선택·구매 다이얼로그: <a href="/week-04">/week-04</a> (
          <code>src/products/</code> · <code>GET /api/product-options</code>)
        </li>
      </ul>
      <p style={noteStyle}>
        4주차 산출물은 그대로 살아 있습니다. 폴더 구성은 각자 근거를 대고 바꿔도 됩니다.
      </p>
    </main>
  );
}
