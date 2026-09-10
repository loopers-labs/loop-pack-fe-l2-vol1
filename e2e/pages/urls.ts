// 로그인 리다이렉트 URL 의 기대값을 한 곳에서 만든다. 파라미터 이름(next·reason)이 바뀌면 여기만 고친다
export const loginUrl = (returnTo?: string, reason?: "expired") => {
  const params = new URLSearchParams();
  if (returnTo !== undefined) {
    params.set("next", returnTo);
  }
  if (reason !== undefined) {
    params.set("reason", reason);
  }
  const query = params.toString();
  return query === "" ? "/login" : `/login?${query}`;
};
