// 원본 리포트와 추출 산출물을 잇는 manifest와 체크섬을 만든다.
// 손으로 적으면 산출물을 다시 뽑을 때 어긋난다. 추출 JSON의 조건을 그대로 옮겨 담는다.

import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OUTPUT_DIR } from './harness.mjs'

const RAW_DIR = join(OUTPUT_DIR, 'raw')
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

const files = (await readdir(RAW_DIR))
  .filter((name) => name.endsWith('.json.gz'))
  .sort()

const groups = new Map()
for (const file of files) {
  const label = file.replace(/-run-\d+\.json\.gz$/, '')
  groups.set(label, [...(groups.get(label) ?? []), file])
}

const manifest = {
  note: '각 원본 Lighthouse 리포트를 gzip -n으로 개별 보관한다. 추출 산출물과 회차가 1:1로 대응한다.',
  groups: [],
}
const checksums = []

for (const [label, groupFiles] of groups) {
  const extractedArtifact = `${label}.json`
  const extracted = JSON.parse(
    await readFile(join(OUTPUT_DIR, extractedArtifact), 'utf8'),
  )
  const { throttlingMethod, blockedUrlPatterns, url, variant } =
    extracted.conditions

  const runs = []
  for (const [index, file] of groupFiles.entries()) {
    const buffer = await readFile(join(RAW_DIR, file))
    const compressed = sha256(buffer)
    checksums.push(`${compressed}  ${file}`)
    runs.push({
      run: index + 1,
      file,
      sha256: compressed,
      // 압축 방식이 달라져도 원본 내용을 대조할 수 있게 함께 남긴다.
      uncompressedSha256: sha256(gunzipSync(buffer)),
    })
  }

  manifest.groups.push({
    extractedArtifact,
    measuredSha: extracted.measuredSha,
    throttlingMethod,
    blockedUrlPatterns,
    url,
    ...(variant ? { variant } : {}),
    runs,
  })
}

await writeFile(
  join(RAW_DIR, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)
await writeFile(join(RAW_DIR, 'SHA256SUMS'), `${checksums.join('\n')}\n`)
process.stdout.write(
  `${RAW_DIR}/manifest.json (그룹 ${manifest.groups.length}, 회차 ${checksums.length})\n`,
)
