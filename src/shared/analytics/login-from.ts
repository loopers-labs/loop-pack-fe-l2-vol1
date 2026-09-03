import type { LoginFrom } from "./events";

// 복원 경로(next)의 첫 세그먼트로 "어디서 로그인에 왔는가" 를 정한다. 시드 로그의 `from: "cart"` 에 맞춘다
export function loginFromReturnTo(returnTo: string): LoginFrom {
  const segment = returnTo.split(/[?#]/, 1)[0].split("/")[1] ?? "";
  switch (segment) {
    case "checkout":
      return "cart";
    case "orders":
      return "orders";
    case "mypage":
      return "mypage";
    default:
      return "direct";
  }
}
