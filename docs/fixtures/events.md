# 시드 이벤트 로그 — `fixtures/events-30d.jsonl`

30일 분량의 사용자 행동 로그입니다. 한 줄이 이벤트 하나예요 (JSON Lines).

## 필드

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `sessionId` | string | 세션 식별자. 같은 세션의 이벤트는 같은 값을 가집니다 |
| `ts` | string | ISO 8601 UTC 타임스탬프 |
| `name` | string | 이벤트 이름 |
| `props` | object | 이벤트별 속성 |
| `userId` | string? | 로그인한 뒤의 이벤트에만 있습니다 |
| `device` | string \| null | `mobile` · `desktop` · `tablet`. `null`인 줄도 있습니다 |

## 이벤트 이름

| 이름 | 발생 시점 |
| --- | --- |
| `product_list_view` | 목록 화면 진입 |
| `category_filter_change` | 카테고리 변경 |
| `sort_change` | 정렬 변경 |
| `page_change` | 페이지 이동 |
| `product_detail_view` | 상세 화면 진입 |
| `cart_add` | 장바구니 담기 |
| `wishlist_add` | 위시리스트 추가 |
| `login_start` | 로그인 화면 진입 |
| `login_success` | 로그인 성공 |
| `login_fail` | 로그인 실패 |
| `order_start` | 주문서 진입 |
| `order_complete` | 주문 완료 |
| `client_error` | 클라이언트 오류 |

## 읽을 때 주의할 점

이 로그는 실제 서비스 로그와 같은 문제를 가지고 있어요.

- 사람이 아닌 트래픽이 섞여 있습니다. 어떤 줄이 그런지는 표시되어 있지 않아요.
- 같은 이벤트가 두 번 전송된 줄이 있습니다.
- 오류 이벤트가 정상 흐름 사이에 끼어 있습니다.
- **이 코드베이스에 없는 화면의 이벤트도 있습니다.** 로그 스키마는 서비스보다 오래 살거나 먼저 정의되곤 해요.

그대로 집계하면 순위가 틀어져요. 무엇을 제외할지는 직접 정하고, 그 기준을 RFC에 남기세요.

파일 크기가 커서 에디터로 열기보다 스크립트로 집계하는 편이 빠릅니다.
