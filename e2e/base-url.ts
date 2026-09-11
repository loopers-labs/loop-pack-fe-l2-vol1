// baseURL은 playwright.config와 fixture가 함께 쓴다.
// worker fixture에서 config의 `baseURL`(테스트 스코프 옵션)을 받을 수 없어 상수를 한 곳에 둔다.
export const BASE_URL = 'http://127.0.0.1:3000';
