// 커밋된 원본 리포트에서 filmstrip 프레임을 꺼낸다.
// 셸이 먼저 그려졌다는 주장은 순서가 결론이라, 연속 화면이 문장보다 강하다.
// Lighthouse가 screenshot-thumbnails 감사에 프레임을 이미 담아 두므로 재측정하지 않는다.

import { gunzipSync } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OUTPUT_DIR } from './harness.mjs'

const RAW_DIR = join(OUTPUT_DIR, 'raw')
const OUT_DIR = join(OUTPUT_DIR, 'filmstrip')

// 회차는 중앙값 회차 하나만 쓴다. 여덟 장을 다섯 벌 뽑으면 무엇을 보라는 건지 흐려진다.
const TARGETS = [
  { label: 'before', file: 'lighthouse-home-before-run-3.json.gz' },
  { label: 'after', file: 'lighthouse-home-after-run-3.json.gz' },
]

const rows = []

for (const { label, file } of TARGETS) {
  const report = JSON.parse(gunzipSync(await readFile(join(RAW_DIR, file))))
  const items = report.audits['screenshot-thumbnails']?.details?.items ?? []
  if (items.length === 0) {
    throw new Error(`${file}에 filmstrip 프레임이 없다`)
  }

  await mkdir(join(OUT_DIR, label), { recursive: true })

  const frames = []
  for (const [index, item] of items.entries()) {
    const base64 = item.data.replace(/^data:image\/jpeg;base64,/, '')
    const name = `${String(index + 1).padStart(2, '0')}-${Math.round(item.timing)}ms.jpg`
    await writeFile(join(OUT_DIR, label, name), Buffer.from(base64, 'base64'))
    frames.push({ name, timing: Math.round(item.timing) })
  }

  rows.push({ label, frames })
  process.stdout.write(
    `${label}: ${frames.length}장 (${frames.at(-1).timing}ms까지)\n`,
  )
}

// 표 한 줄에 나란히 두면 GitHub에서 연속 화면으로 읽힌다.
const table = rows
  .map(({ label, frames }) => {
    const header = `| ${label} | ${frames.map((f) => `${f.timing}ms`).join(' | ')} |`
    const divider = `| --- | ${frames.map(() => '---').join(' | ')} |`
    const images = `| | ${frames
      .map((f) => `![](filmstrip/${label}/${f.name})`)
      .join(' | ')} |`
    return [header, divider, images].join('\n')
  })
  .join('\n\n')

await writeFile(join(OUT_DIR, 'README.md'), `# Filmstrip\n\n${table}\n`)
process.stdout.write(`${join(OUT_DIR, 'README.md')}\n`)
