// 승격한 룰(날짜 로케일 포맷 금지)이 테스트 파일에도 실리는지 지킨다.
//
// 룰이 망가지는 경로는 셋인데 둘은 린트를 돌리면 바로 드러난다 — `ignores` 경로가
// 죽으면 포맷터가 자기 규칙에 걸리고, selector를 잘못 고치면 위반 코드를 쓰는 순간
// 안 막힌다. 나머지 하나만 조용하다: flat config는 뒤 블록이 같은 규칙을 통째로
// 갈아치우므로, 테스트 블록에 규칙을 추가하며 `...LOCALE_DATE_SELECTORS`를 빠뜨리면
// 에러 없이 테스트 파일에서 룰이 사라진다. 승격 전 실제 위반 2건 중 하나가 테스트
// 파일이었으므로 그 경로를 비워 두지 않는다.
//
// 위반이 빨간불로 막히고 정상이 통과하는 것은 승격 시점에 수동 RED/GREEN으로 확인했다
// (docs/rfc/week10-rule-promotion.md). 여기서 다시 린트를 돌리지는 않는다.
import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

const RULE = 'no-restricted-syntax';
const MESSAGE =
  '표시 타임존이 실행 환경을 따라갑니다. shared/format-datetime의 포맷터를 쓰세요.';

it('테스트 파일에도 날짜 로케일 포맷 금지 룰이 실린다', async () => {
  const config = await new ESLint({
    cwd: process.cwd(),
  }).calculateConfigForFile('tests/orders-page.dom.test.tsx');
  // 규칙 옵션의 첫 칸은 심각도('error')이고 그 뒤가 selector 목록이다.
  const [, ...selectors] = (config.rules?.[RULE] ?? []) as [
    string,
    ...{ message: string }[],
  ];

  expect(selectors.map((selector) => selector.message)).toContain(MESSAGE);
});
