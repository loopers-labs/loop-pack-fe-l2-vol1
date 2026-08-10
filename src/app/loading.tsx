// [AI] 라우트 단위 로딩 fallback. 라우트 전환/서버 페치 중 빈 화면을 가린다.
const Loading = () => (
  <main className="page">
    <p>불러오는 중...</p>
  </main>
);

export default Loading;
