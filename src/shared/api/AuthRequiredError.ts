export class AuthRequiredError extends Error {
  constructor(message = "세션이 만료되었습니다. 다시 로그인해주세요.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}
