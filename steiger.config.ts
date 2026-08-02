import { defineConfig } from "steiger";
import fsd from "@feature-sliced/steiger-plugin";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // FSD 린트 대상에서 제외:
    // - examples: 학습 예제(전환 범위 밖)
    // - src/app: Next.js 예약 라우팅 폴더(FSD app 레이어가 아님 — 그 역할은 _app 이 한다)
    // - 테스트: FSD 슬라이스 구조가 아니며, 내부 모듈 mock 을 위해 public API 를 우회
    ignores: [
      "**/examples/**",
      "src/app/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/__tests__/**",
    ],
  },
  {
    // _app/_pages 는 Next 라우팅 폴더 충돌을 피한 FSD app/pages 의 필수 프리픽스이나, 오타로 오탐하는 현상방지.
    rules: { "fsd/typo-in-layer-name": "off" },
  },
  {
    // insignificant-slice 는 "소비처가 1곳(또는 0곳)뿐인 슬라이스는 따로 빼지 말고 그 소비처에 두라"는
    // 규칙(FSD 의 'Pages First — 2곳 이상에서 실제로 쓸 때만 추출'). 다음사유로 off:
    //
    //  1) 의도적 위반 - search·sort-select·add-to-cart·toggle-wishlist 는 각각 소비처가 1곳이라
    //     규칙이 "그 페이지/위젯에 합쳐라"고 제안한다. 하지만 RADIO 설계에서 이들을 '엄밀히 다른 기능'으로
    //     보고 의도적으로 별도 feature 로 분리했으므로, 규칙을 의도적으로 어긴다.
    //
    //  2) 오탐 — widgets/commerce(헤더)는 app/page·app/products/layout 이 렌더하지만, 그 소비처가
    //     src/app(위에서 ignore 한 Next 예약 라우팅)이라 Steiger 가 참조를 추적하지 못해 "no references"로
    //     오판한다. 실제로는 쓰인다.
    rules: { "fsd/insignificant-slice": "off" },
  },
  {
    // no-segmentless-slices 는 "슬라이스 안에는 세그먼트(ui/api/model/lib 등)가 있어야 한다"는 규칙이다.
    // 단 이 규칙은 슬라이스가 있는 레이어(pages·widgets·features·entities)에만 적용되고,
    // app·shared 는 슬라이스가 없는 레이어(폴더가 곧 세그먼트)라 대상이 아니어야 한다.
    //
    // 오탐 — _app 은 app 레이어라 그 안의 styles/ 는 '슬라이스'가 아니라 '세그먼트'이고, globals.css·
    // app.module.css 만 담아도 정상이다. 그런데 이 규칙이 `_` 프리픽스 레이어를 app 으로 인식하지 못해
    // _app 을 '슬라이스 있는 레이어'로 오판하고, styles 를 "세그먼트 없는 슬라이스"라고 잘못 지적한다.
    // 그래서 _app 범위에서만 off.
    files: ["src/_app/**"],
    rules: { "fsd/no-segmentless-slices": "off" },
  },
]);
