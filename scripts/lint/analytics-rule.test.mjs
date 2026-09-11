// 9주차 "화면에서 원시 계측 호출 금지"를 10주차에 ESLint error로 승격했다.
// 승격한 룰은 eslint.config.mjs의 패턴 문자열 하나만 지워도 다시 통과한다.
// 우회 경로를 실제 린팅 결과로 고정해 그 회귀를 검출한다.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ESLint } from 'eslint'

const eslint = new ESLint()

// 승격한 두 룰의 메시지만 센다. 프로브 코드가 부수적으로 위반하는 다른 룰은 판정에서 뺀다.
const RULE_IDS = new Set(['no-restricted-imports', 'no-restricted-syntax'])

const lint = async (filePath, code) => {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((message) => RULE_IDS.has(message.ruleId))
}

const SCREEN_FILE = 'src/features/probe/ui/Probe.ts'

describe('원시 계측 import 차단', () => {
  it('alias named import를 막는다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "import { track } from '@/analytics/logger'\nexport const a = () => track('x')\n",
    )

    assert.equal(messages.length, 1)
    assert.equal(messages[0].ruleId, 'no-restricted-imports')
  })

  it('상대경로 named import를 막는다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "import { identify } from '../../../analytics/logger'\nexport const a = (id: string) => identify(id)\n",
    )

    assert.equal(messages.length, 1)
  })

  it('확장자를 붙인 import를 막는다', async () => {
    // TypeScript는 `@/analytics/logger.js`를 실제 logger.ts로 해석한다.
    // 확장자 표기만 바꾸면 제한을 빠져나가던 우회다.
    const messages = await lint(
      SCREEN_FILE,
      "import { track as t } from '@/analytics/logger.js'\nexport const a = () => t('x')\n",
    )

    assert.equal(messages.length, 1)
  })

  it('namespace import를 막는다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "import * as logger from '@/analytics/logger'\nexport const a = () => logger.track('x')\n",
    )

    assert.equal(messages.length, 1)
  })

  it('re-export를 막는다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "export { track } from '@/analytics/logger'\n",
    )

    assert.equal(messages.length, 1)
  })

  it('동적 import를 막는다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "export const a = async () => {\n  const m = await import('@/analytics/logger')\n  m.track('x')\n}\n",
    )

    assert.equal(messages.length, 1)
    assert.equal(messages[0].ruleId, 'no-restricted-syntax')
  })
})

describe('정당한 사용은 통과시킨다', () => {
  it('flush는 제한 대상이 아니다', async () => {
    const messages = await lint(
      SCREEN_FILE,
      "import { flush } from '@/analytics/logger'\nexport const a = () => flush()\n",
    )

    assert.deepEqual(messages, [])
  })

  it('analytics 내부 wrapper는 logger를 직접 쓴다', async () => {
    const messages = await lint(
      'src/analytics/events.ts',
      "import { track } from './logger'\nexport const viewed = () => track('viewed')\n",
    )

    assert.deepEqual(messages, [])
  })
})

describe('테스트 파일의 기존 제한', () => {
  it('node 테스트의 Testing Library import를 계속 막는다', async () => {
    // 이 제한과 계측 제한은 같은 no-restricted-imports 항목을 공유한다.
    // 한쪽을 고치다 다른 쪽을 빠뜨리면 이 케이스가 실패한다.
    const messages = await lint(
      'src/features/probe/model/probe.test.ts',
      "import { render } from '@testing-library/react'\nexport const a = render\n",
    )

    assert.equal(messages.length, 1)
  })

  it('node 테스트에서도 원시 계측 import를 막는다', async () => {
    const messages = await lint(
      'src/features/probe/model/probe.test.ts',
      "import { track } from '@/analytics/logger'\nexport const a = () => track('x')\n",
    )

    assert.equal(messages.length, 1)
  })

  it('node 테스트에서도 동적 import를 막는다', async () => {
    const messages = await lint(
      'src/features/probe/model/probe.test.ts',
      "export const a = async () => {\n  const m = await import('@/analytics/logger')\n  m.track('x')\n}\n",
    )

    assert.equal(messages.length, 1)
    assert.equal(messages[0].ruleId, 'no-restricted-syntax')
  })
})
