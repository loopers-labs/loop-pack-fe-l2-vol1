#!/usr/bin/env node
// 시드 이벤트 로그를 세션 기준으로 집계한다.
//
// 이 스크립트는 무엇을 노이즈로 볼지 정하지 않는다. 후보와 그 영향만 보여주고,
// 거를지 말지는 플래그로 사람이 고른다. 기본값은 아무것도 거르지 않은 원본이다.
// "그대로 집계하면 순위가 틀어진다"는 말을 확인하려면 거르기 전후를 같이 봐야 한다.
//
//   node scripts/analytics/funnel.mjs                     원본
//   node scripts/analytics/funnel.mjs --drop-duplicates   중복 전송 제거
//   node scripts/analytics/funnel.mjs --drop-bots         봇 후보 세션 제거
//   node scripts/analytics/funnel.mjs --drop-errors       client_error 제거
//   node scripts/analytics/funnel.mjs --all --compare     전부 거르고 원본과 비교
//   node scripts/analytics/funnel.mjs --json              기계가 읽을 형태로
import { readFileSync } from 'node:fs'
import process from 'node:process'

const args = new Set(process.argv.slice(2))
const has = (flag) => args.has(flag) || args.has('--all')
const asJson = args.has('--json')

const rows = readFileSync('fixtures/events-30d.jsonl', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))

// 퍼널 단계다. 로그 스키마의 이름을 그대로 쓴다. 이 순서가 곧 "무엇을 지나
// 무엇으로 가는가"의 가정이므로, 다르게 보고 싶으면 여기를 고치고 근거를 남긴다.
const FUNNEL = [
  'product_list_view',
  'product_detail_view',
  'cart_add',
  'login_success',
  'order_start',
  'order_complete',
]

const groupBySession = (list) => {
  const sessions = new Map()
  for (const row of list) {
    const bucket = sessions.get(row.sessionId) ?? []
    bucket.push(row)
    sessions.set(row.sessionId, bucket)
  }
  for (const bucket of sessions.values()) {
    bucket.sort((a, b) => a.ts.localeCompare(b.ts))
  }
  return sessions
}

// --- 노이즈 후보 -----------------------------------------------------------
// 각 후보는 "무엇을 근거로 골랐는가"를 이름에 담는다. 로그에 봇 표시는 없으므로
// 전부 추정이고, 추정의 근거를 숫자로 함께 낸다.

// 같은 세션에서 이름·시각·속성이 모두 같은 줄. 한 번의 행동이 두 번 전송된 흔적이다.
const duplicateKeys = (list) => {
  const seen = new Set()
  const duplicates = new Set()
  list.forEach((row, index) => {
    const key = `${row.sessionId}|${row.name}|${row.ts}|${JSON.stringify(row.props ?? {})}`
    if (seen.has(key)) duplicates.add(index)
    else seen.add(key)
  })
  return duplicates
}

// 봇 후보: device 를 남기지 않았고, 세션 전체가 목록 진입 한 번뿐이며,
// 시각의 밀리초가 0인 세션. 사람이 브라우저로 들어온 흔적(단말 정보, 다음 행동,
// 밀리초 단위 시각)이 셋 다 없다.
const botSessions = (sessions) => {
  const bots = new Set()
  for (const [sessionId, bucket] of sessions) {
    const single = bucket.length === 1
    const noDevice = bucket.every((row) => row.device === null)
    const wholeSecond = bucket.every((row) => row.ts.endsWith('.000Z'))
    if (single && noDevice && wholeSecond) bots.add(sessionId)
  }
  return bots
}

const applyFilters = (list) => {
  const notes = []
  let result = list

  if (has('--drop-duplicates')) {
    const duplicates = duplicateKeys(result)
    notes.push(`중복 전송 ${duplicates.size}줄 제거`)
    result = result.filter((_, index) => !duplicates.has(index))
  }

  if (has('--drop-bots')) {
    const bots = botSessions(groupBySession(result))
    const before = result.length
    result = result.filter((row) => !bots.has(row.sessionId))
    notes.push(`봇 후보 세션 ${bots.size}개(${before - result.length}줄) 제거`)
  }

  if (has('--drop-errors')) {
    const before = result.length
    result = result.filter((row) => row.name !== 'client_error')
    notes.push(`client_error ${before - result.length}줄 제거`)
  }

  return { rows: result, notes }
}

// --- 집계 ------------------------------------------------------------------

const summarize = (list) => {
  const sessions = groupBySession(list)
  const totalSessions = sessions.size

  // 세션 기준으로 센다. 이벤트 수로 세면 정렬을 다섯 번 바꾼 한 사람이
  // 주문 완료보다 위로 올라온다.
  const sessionsWith = new Map()
  // 이탈률 정의 (1): 그 이벤트가 세션의 마지막이었던 비율
  const lastEvent = new Map()

  for (const bucket of sessions.values()) {
    const names = new Set(bucket.map((row) => row.name))
    for (const name of names) {
      sessionsWith.set(name, (sessionsWith.get(name) ?? 0) + 1)
    }
    const last = bucket[bucket.length - 1].name
    lastEvent.set(last, (lastEvent.get(last) ?? 0) + 1)
  }

  const byEvent = [...sessionsWith.entries()]
    .map(([name, count]) => ({
      name,
      sessions: count,
      shareOfAllSessions: count / totalSessions,
      // 이탈률 정의 (1)
      exitRateAsLastEvent: (lastEvent.get(name) ?? 0) / count,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  // 이탈률 정의 (2): 앞 단계를 지난 세션 중 다음 단계로 넘어가지 못한 비율
  const funnel = FUNNEL.map((name, index) => {
    const reached = sessionsWith.get(name) ?? 0
    const next = FUNNEL[index + 1]
    const nextReached = next ? (sessionsWith.get(next) ?? 0) : null
    return {
      step: name,
      sessions: reached,
      shareOfAllSessions: reached / totalSessions,
      // 앞 단계를 지나온 세션을 분모로 한 전환율
      conversionFromPrevious:
        index === 0
          ? null
          : reached / (sessionsWith.get(FUNNEL[index - 1]) ?? 1),
      dropToNextStep:
        nextReached === null || reached === 0
          ? null
          : 1 - nextReached / reached,
    }
  })

  return { totalSessions, totalEvents: list.length, byEvent, funnel }
}

const percent = (value) =>
  value === null ? '—' : `${(value * 100).toFixed(1)}%`

const printReport = (title, report) => {
  process.stdout.write(`\n## ${title}\n`)
  process.stdout.write(
    `세션 ${report.totalSessions} · 이벤트 ${report.totalEvents}\n\n`,
  )
  process.stdout.write(
    '| 이벤트 | 세션 수 | 전체 세션 대비 | 마지막 이벤트였던 비율 |\n| --- | --- | --- | --- |\n',
  )
  for (const row of report.byEvent) {
    process.stdout.write(
      `| ${row.name} | ${row.sessions} | ${percent(row.shareOfAllSessions)} | ${percent(row.exitRateAsLastEvent)} |\n`,
    )
  }

  process.stdout.write('\n### 퍼널 (위 FUNNEL 순서 가정)\n\n')
  process.stdout.write(
    '| 단계 | 세션 수 | 전체 대비 | 직전 단계 대비 | 다음 단계로 못 간 비율 |\n| --- | --- | --- | --- | --- |\n',
  )
  for (const step of report.funnel) {
    process.stdout.write(
      `| ${step.step} | ${step.sessions} | ${percent(step.shareOfAllSessions)} | ${percent(step.conversionFromPrevious)} | ${percent(step.dropToNextStep)} |\n`,
    )
  }
}

const rankOf = (report) => report.byEvent.map((row) => row.name)

const original = summarize(rows)
const { rows: filtered, notes } = applyFilters(rows)
const cleaned = summarize(filtered)

if (asJson) {
  process.stdout.write(
    `${JSON.stringify({ notes, original, cleaned }, null, 2)}\n`,
  )
} else {
  process.stdout.write('# 시드 로그 집계 — 세션 기준\n')
  if (notes.length > 0) {
    process.stdout.write(`\n적용한 필터: ${notes.join(' · ')}\n`)
  } else {
    process.stdout.write(
      '\n적용한 필터: 없음 (--drop-duplicates · --drop-bots · --drop-errors · --all)\n',
    )
  }

  if (args.has('--compare') && notes.length > 0) {
    printReport('거르기 전', original)
    printReport('거른 뒤', cleaned)

    const before = rankOf(original)
    const after = rankOf(cleaned)
    process.stdout.write('\n### 순위 변화\n\n')
    const moved = after
      .map((name, index) => ({
        name,
        before: before.indexOf(name),
        after: index,
      }))
      .filter((row) => row.before !== row.after)
    if (moved.length === 0) {
      process.stdout.write(
        '순위가 바뀌지 않았다. 무엇이 왜 안 바뀌었는지는 RFC에서 판단한다.\n',
      )
    } else {
      for (const row of moved) {
        process.stdout.write(
          `- ${row.name}: ${row.before + 1}위 → ${row.after + 1}위\n`,
        )
      }
    }
  } else {
    printReport(notes.length > 0 ? '거른 뒤' : '원본', cleaned)
  }
}
