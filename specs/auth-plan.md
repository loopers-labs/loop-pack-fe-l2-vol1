# 테스트 계획 — 인증 (planner 산출물)

> `playwright init-agents --loop=claude`가 만든 planner 정의를 따라 브라우저로 화면을
> 탐색해 만든 계획이다. **검수 전 원본이고, 이걸 그대로 채택하지 않았다** —
> 무엇을 지웠고 왜인지는 `docs/rfc/week09-e2e-scope.md` E절에 있다.

**Seed:** `e2e/seed.spec.ts`

## 1. 인증 플로우

### 1.1 미로그인으로 보호 경로에 진입하면 로그인으로 이동한다

**Steps:**

1. `/checkout?productId=p3&quantity=2`로 이동한다
2. 주소가 `/login?next=%2Fcheckout%3FproductId%3Dp3%26quantity%3D2`로 바뀐 것을 확인한다
3. 페이지 제목이 `로그인 · Commerce`인 것을 확인한다
4. 헤더에 `로그인` 링크가 보이는 것을 확인한다
5. 헤더에 `위시리스트 0`과 `장바구니 0`이 보이는 것을 확인한다
6. 이메일·비밀번호 textbox와 `로그인` 버튼이 보이는 것을 확인한다
7. 테스트 계정 안내 문구(`looper1@loopers.dev` ~ `looper8@loopers.dev`)가 보이는 것을 확인한다

### 1.2 로그인하면 원래 가려던 경로로 돌아온다

**Steps:**

1. `/checkout?productId=p3&quantity=2`로 이동한다 (로그인으로 리다이렉트된다)
2. 이메일에 `looper1@loopers.dev`를 입력한다
3. 비밀번호에 `looper1234`를 입력한다
4. `로그인` 버튼을 클릭한다
5. 주소가 `/checkout?productId=p3&quantity=2`로 돌아온 것을 확인한다
6. 페이지 제목이 `주문서 · Commerce`인 것을 확인한다
7. 헤더에서 `로그인` 링크가 사라지고 `로그아웃` 버튼과 `주문 내역` 링크가 나타난 것을 확인한다
8. 헤더에 `루퍼1`이 보이는 것을 확인한다
9. `주문 상품` 영역에 상품명 `[1+1] 베이직 무지 롱 슬리브 102-CVL 17수 긴팔티`가 보이는 것을 확인한다
10. 브랜드 `Loopers Select`가 보이는 것을 확인한다
11. `수량 2개`가 보이는 것을 확인한다
12. 금액 `68,000원`이 보이는 것을 확인한다
13. `주문하기` 버튼이 보이는 것을 확인한다
