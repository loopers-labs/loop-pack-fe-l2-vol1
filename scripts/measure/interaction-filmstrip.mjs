// 찜 클릭 전후를 연속 화면으로 남긴다.
// 클릭 지연은 세 구간 값으로 설명하지만, 무엇이 언제 바뀌었는지는 화면이 더 빠르다.
// Lighthouse는 클릭을 만들지 않아 리포트에 이 구간이 없다. CDP 화면 캡처로 직접 모은다.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  baseUrl,
  OUTPUT_DIR,
  sleep,
  waitForImages,
  withPage,
} from './harness.mjs'

const PATH = '/performance-lab/inp?pageSize=24'
const OUT_DIR = join(OUTPUT_DIR, 'interaction-filmstrip')
// CPU 4배 감속은 interaction.mjs와 같은 조건이다. 감속이 없으면 프레임이 한두 장에 끝난다.
const CPU_THROTTLE = 4
const CAPTURE_MS = 900

const frames = await withPage(
  'desktop',
  async (page, viewport) => {
    const cdp = await page.context().newCDPSession(page)
    await page.goto(`${baseUrl()}${PATH}`, { waitUntil: 'networkidle' })
    await waitForImages(page)
    await sleep(500)

    const collected = []
    let start = null
    cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
      // timestamp는 초 단위 epoch다. 첫 프레임을 0으로 두고 상대 시각으로 옮긴다.
      start ??= metadata.timestamp
      collected.push({
        data,
        offsetMs: Math.round((metadata.timestamp - start) * 1000),
      })
      await cdp.send('Page.screencastFrameAck', { sessionId })
    })

    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 80,
      everyNthFrame: 1,
    })

    const button = page.locator('article').first().locator('button').first()
    const before = await button.getAttribute('aria-pressed')
    await button.click()
    await sleep(CAPTURE_MS)
    const after = await button.getAttribute('aria-pressed')

    await cdp.send('Page.stopScreencast')

    if (before === after) {
      throw new Error(`찜 상태가 바뀌지 않았다: ${before} -> ${after}`)
    }
    return { collected, viewport, before, after }
  },
  { cpuThrottle: CPU_THROTTLE },
)

await mkdir(OUT_DIR, { recursive: true })

// CDP는 화면이 바뀔 때만 프레임을 보내는데, 같은 그림이 연달아 오는 경우가 있다.
// 다른 시각 라벨을 붙여 나란히 두면 그 사이에 변화가 있었던 것처럼 읽힌다. 앞 프레임과
// 같은 바이트면 버린다.
const changed = frames.collected.filter(
  (frame, index) =>
    index === 0 || frame.data !== frames.collected[index - 1].data,
)

// 남은 프레임이 많으면 균등하게 고른다. 전부 남기면 무엇을 보라는 건지 흐려진다.
const KEEP = 8
const step = Math.max(1, Math.ceil(changed.length / KEEP))
const picked = changed.filter((_, index) => index % step === 0).slice(0, KEEP)

const written = []
for (const [index, frame] of picked.entries()) {
  const name = `${String(index + 1).padStart(2, '0')}-${frame.offsetMs}ms.jpg`
  await writeFile(join(OUT_DIR, name), Buffer.from(frame.data, 'base64'))
  written.push({ name, offsetMs: frame.offsetMs })
}

const header = `| 클릭 기준 | ${written.map((f) => `${f.offsetMs}ms`).join(' | ')} |`
const divider = `| --- | ${written.map(() => '---').join(' | ')} |`
const images = `| | ${written.map((f) => `![](./${f.name})`).join(' | ')} |`

await writeFile(
  join(OUT_DIR, 'README.md'),
  [
    '# Interaction filmstrip',
    '',
    `찜 버튼 클릭 전후. CPU ${CPU_THROTTLE}배 감속, ${frames.viewport.width}x${frames.viewport.height} DPR ${frames.viewport.dpr}.`,
    `aria-pressed는 ${frames.before}에서 ${frames.after}로 바뀐다.`,
    `CDP는 화면이 바뀔 때만 프레임을 보낸다. ${frames.collected.length}장을 받아 앞 프레임과 같은 그림을 버리고 ${written.length}장이 남았다.`,
    '장수가 적은 것은 변화가 작고 빨랐다는 뜻이다. 클릭 한 번이 카드 하나만 다시 그린다.',
    '',
    header,
    divider,
    images,
    '',
  ].join('\n'),
)

process.stdout.write(
  `${frames.collected.length}장 수집, ${written.length}장 보관 -> ${join(OUT_DIR, 'README.md')}\n`,
)
