#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  collectModuleSpecifiers,
  normalizePath,
  validateImport,
} from './lib.mjs'

const format = process.argv.includes('--json') ? 'json' : 'text'
const stagedOnly = process.argv.includes('--staged')
const root = process.cwd()

const gitOutput = (args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  })

const readRepositoryFile = async (file) =>
  stagedOnly
    ? gitOutput(['show', `:${normalizePath(file)}`])
    : readFile(path.join(root, file), 'utf8')

let config
try {
  config = JSON.parse(await readRepositoryFile('architecture.config.json'))
} catch (error) {
  process.stderr.write(
    stagedOnly
      ? 'Architecture check cannot read architecture.config.json from the Git index. Stage the harness files before testing the staged snapshot.\n'
      : `Architecture check cannot read architecture.config.json: ${error.message}\n`,
  )
  process.exit(1)
}

const walk = async (directory) => {
  const entries = await readdir(directory)
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry)
      return (await stat(absolute)).isDirectory() ? walk(absolute) : [absolute]
    }),
  )
  return nested.flat()
}

const stagedFiles = () => {
  try {
    return gitOutput(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(normalizePath)
  } catch {
    return []
  }
}

const repositoryFiles = stagedOnly
  ? gitOutput(['ls-files', '--cached'])
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(normalizePath)
  : (await walk(path.join(root, 'src'))).map((file) =>
      normalizePath(path.relative(root, file)),
    )
const allSourceFiles = repositoryFiles.filter(
  (file) => file.startsWith('src/') && /\.[cm]?[jt]sx?$/.test(file),
)
const candidates = allSourceFiles
const findings = []
let importCount = 0

for (const file of candidates) {
  const source = await readRepositoryFile(file)
  for (const imported of collectModuleSpecifiers(source, file)) {
    importCount += 1
    for (const finding of validateImport({
      importer: file,
      specifier: imported.specifier,
      publicApis: config.publicApis,
    })) {
      findings.push({ file, line: imported.line, ...finding })
    }
  }
}

const slicedLayerPattern =
  /^src\/(?:_pages|widgets|features|entities)\/[^/]+\/index\.ts$/
const discoveredPublicApis = allSourceFiles
  .filter((file) => slicedLayerPattern.test(file))
  .map((file) => file.slice(0, -'/index.ts'.length))
  .sort()
const configuredPublicApis = [...config.publicApis].sort()

for (const publicApi of discoveredPublicApis) {
  if (!configuredPublicApis.includes(publicApi)) {
    findings.push({
      file: `${publicApi}/index.ts`,
      line: 1,
      rule: 'public-api/unconfigured',
      message: '슬라이스 루트 index.ts를 Public API 설정에 등록해야 합니다.',
    })
  }
}

for (const publicApi of config.publicApis) {
  const indexPath = `${publicApi}/index.ts`
  let source
  try {
    source = await readRepositoryFile(indexPath)
  } catch {
    findings.push({
      file: indexPath,
      line: 1,
      rule: 'public-api/missing',
      message: '설정된 Public API의 index.ts가 없습니다.',
    })
    continue
  }

  const exportAll = /^\s*export\s+\*\s+from/m.exec(source)
  if (exportAll) {
    findings.push({
      file: indexPath,
      line: source.slice(0, exportAll.index).split('\n').length,
      rule: 'public-api/export-all',
      message:
        'Public API는 export * 대신 공개할 계약을 이름으로 명시해야 합니다.',
    })
  }
}

for (const guard of config.documentGuards) {
  const content = await readRepositoryFile(guard.file)
  for (const staleText of guard.forbid) {
    const index = content.indexOf(staleText)
    if (index >= 0) {
      findings.push({
        file: guard.file,
        line: content.slice(0, index).split('\n').length,
        rule: 'rfc/stale-decision',
        message: `현재 결정과 충돌하는 문구가 남아 있습니다: ${staleText}`,
      })
    }
  }
  for (const requiredText of guard.require) {
    if (!content.includes(requiredText)) {
      findings.push({
        file: guard.file,
        line: 1,
        rule: 'rfc/missing-decision',
        message: `확정된 결정을 설명하는 문구가 없습니다: ${requiredText}`,
      })
    }
  }
}

const report = {
  passed: findings.length === 0,
  scope: stagedOnly ? 'staged' : 'repository',
  stats: {
    files: candidates.length,
    imports: importCount,
    publicApis: config.publicApis.length,
  },
  stagedFiles: stagedFiles(),
  findings,
  manualReview: config.manualReview,
}

if (format === 'json') {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} else if (report.passed) {
  process.stdout.write(
    `Architecture check passed: ${report.stats.files} files, ${report.stats.imports} imports, ${report.stats.publicApis} public APIs\n`,
  )
} else {
  process.stderr.write(
    `Architecture check failed with ${findings.length} finding(s):\n`,
  )
  for (const finding of findings) {
    process.stderr.write(
      `- ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}\n`,
    )
  }
}

process.exitCode = report.passed ? 0 : 1
