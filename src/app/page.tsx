export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Commerce
      </h1>
      <p style={{ color: "#5a6675", lineHeight: 1.7, marginBottom: 24 }}>
        4주차부터 여기에 커머스를 쌓아갑니다. 이번 주는 디자인 시스템의 뼈대
        <b> Select</b>와 <b>Dialog</b>를 직접 만드는 것부터 시작해요.
      </p>
      <ul style={{ lineHeight: 2, color: "#18212e", paddingLeft: 18 }}>
        <li>
          컴포넌트 자리: <code>src/components/ui/select</code> ·{" "}
          <code>src/components/ui/dialog</code>
        </li>
        <li>
          mock 백엔드: <code>GET /api/products</code> (
          <code>src/app/api/products/route.ts</code>)
        </li>
        <li>
          과제 명세: <code>docs/assignments/week-04.md</code>
        </li>
      </ul>
      <p style={{ color: "#8794a3", marginTop: 24, fontSize: 14 }}>
        구조는 최소 골격만 있어요. 폴더 구성은 각자 근거를 대고 바꾸면 돼요.
      </p>
    </main>
  );
}
