// 시드 이벤트 로그(fixtures/events-30d.jsonl) 집계 도구 — 9주차 3단계 B절의 재료를 뽑는다.
//
// 이 스크립트는 "무엇이 노이즈인가"를 정하지 않는다. 판단 재료(진단 절)를 보여주고,
// 걸러내기 기준은 플래그로 받아 적용 전/후 순위를 나란히 낸다. 기준과 근거는 RFC에 적는다.
//
//   node scripts/analyze-events.mts                       # 원본 그대로 집계 + 노이즈 진단
//   node scripts/analyze-events.mts --drop-dupes --drop-device-null --fail-events login_fail,client_error
//   node scripts/analyze-events.mts --help
//
// 세션 기준으로 센다(한 세션에서 같은 이벤트가 여러 번 나와도 1). 비율의 분모는 표마다 명시한다.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

type AnalyticsEvent = {
  sessionId: string;
  ts: string;
  name: string;
  props: Record<string, unknown>;
  userId?: string;
  device: string | null;
};

type Session = {
  id: string;
  events: AnalyticsEvent[];
};

type Filters = {
  dropDupes: boolean;
  dropDeviceNull: boolean;
  minEvents: number;
  dropStartHours: number[];
  excludeEvents: string[];
};

const DEFAULT_FILE = path.resolve(
  import.meta.dirname,
  '../fixtures/events-30d.jsonl',
);

// docs/fixtures/events.md의 발생 시점 순서를 기본 퍼널로 둔다. --funnel로 바꿀 수 있다.
const DEFAULT_FUNNEL = [
  'product_list_view',
  'product_detail_view',
  'cart_add',
  'login_start',
  'login_success',
  'order_start',
  'order_complete',
];

const HELP = `사용법: node scripts/analyze-events.mts [파일] [옵션]

필터 (기본은 전부 꺼져 있다 — 원본 그대로 집계한다)
  --drop-dupes              완전히 동일한 줄(sessionId·ts·name·props)을 하나만 남긴다
  --drop-device-null        device가 null인 이벤트를 버린다
  --min-events N            이벤트가 N개 미만인 세션을 버린다
  --drop-start-hours H,H    세션 첫 이벤트의 UTC 시각이 H인 세션을 버린다 (예: 1)
  --exclude-events A,B      이 이벤트를 경로 집계에서 뺀다 (세션은 남긴다)

집계
  --funnel A,B,C            퍼널 단계 순서 (기본: ${DEFAULT_FUNNEL.join(',')})
  --fail-events A,B         실패로 셀 이벤트 (지정하지 않으면 실패 비용 절을 건너뛴다)
  --top N                   순위 표 행 수 (기본 20)
  --help
`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toEvent = (value: unknown, line: number): AnalyticsEvent => {
  if (!isRecord(value)) {
    throw new Error(`${line}번째 줄: 객체가 아닙니다`);
  }
  const { sessionId, ts, name, props, userId, device } = value;
  if (
    typeof sessionId !== 'string' ||
    typeof ts !== 'string' ||
    typeof name !== 'string'
  ) {
    throw new Error(`${line}번째 줄: sessionId·ts·name은 문자열이어야 합니다`);
  }
  if (!isRecord(props)) {
    throw new Error(`${line}번째 줄: props가 객체가 아닙니다`);
  }
  if (userId !== undefined && typeof userId !== 'string') {
    throw new Error(`${line}번째 줄: userId가 문자열이 아닙니다`);
  }
  if (device !== null && typeof device !== 'string') {
    throw new Error(`${line}번째 줄: device는 문자열 또는 null이어야 합니다`);
  }
  return userId === undefined
    ? { sessionId, ts, name, props, device }
    : { sessionId, ts, name, props, userId, device };
};

const readEvents = (file: string): AnalyticsEvent[] =>
  readFileSync(file, 'utf8')
    .split('\n')
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw.length > 0)
    .map(({ raw, line }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error(`${line}번째 줄: JSON 파싱 실패 (${String(error)})`);
      }
      return toEvent(parsed, line);
    });

const eventKey = (event: AnalyticsEvent) =>
  [event.sessionId, event.ts, event.name, JSON.stringify(event.props)].join(
    '|',
  );

const hourOf = (ts: string) => new Date(ts).getUTCHours();

const groupSessions = (events: AnalyticsEvent[]): Session[] => {
  const bySession = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const list = bySession.get(event.sessionId);
    if (list) {
      list.push(event);
    } else {
      bySession.set(event.sessionId, [event]);
    }
  }
  return [...bySession.entries()].map(([id, list]) => ({
    id,
    events: [...list].sort((a, b) => a.ts.localeCompare(b.ts)),
  }));
};

const applyFilters = (
  events: AnalyticsEvent[],
  filters: Filters,
): Session[] => {
  let kept = events;

  if (filters.dropDupes) {
    const seen = new Set<string>();
    kept = kept.filter((event) => {
      const key = eventKey(event);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  if (filters.dropDeviceNull) {
    kept = kept.filter((event) => event.device !== null);
  }

  let sessions = groupSessions(kept);

  if (filters.dropStartHours.length > 0) {
    const hours = new Set(filters.dropStartHours);
    sessions = sessions.filter((session) => {
      const first = session.events[0];
      return first === undefined || !hours.has(hourOf(first.ts));
    });
  }

  if (filters.minEvents > 1) {
    sessions = sessions.filter(
      (session) => session.events.length >= filters.minEvents,
    );
  }

  if (filters.excludeEvents.length > 0) {
    const excluded = new Set(filters.excludeEvents);
    sessions = sessions
      .map((session) => ({
        id: session.id,
        events: session.events.filter((event) => !excluded.has(event.name)),
      }))
      .filter((session) => session.events.length > 0);
  }

  return sessions;
};

// ── 집계 ────────────────────────────────────────────────────────────────

type PathRow = {
  name: string;
  sessions: number;
  /** 분모 = 집계 대상 세션 전체 */
  share: number;
  /** 이탈률 A: 이 이벤트가 세션의 마지막 이벤트였던 세션 / 이 이벤트가 있는 세션 */
  lastRate: number;
  /** 이탈률 B: 퍼널 다음 단계에 도달하지 못한 세션 / 이 이벤트가 있는 세션 (퍼널에 있는 이벤트만) */
  nextMissRate: number | null;
};

const rankPaths = (sessions: Session[], funnel: string[]): PathRow[] => {
  const withEvent = new Map<string, number>();
  const lastEvent = new Map<string, number>();
  const nextMiss = new Map<string, number>();

  for (const session of sessions) {
    const names = new Set(session.events.map((event) => event.name));
    for (const name of names) {
      withEvent.set(name, (withEvent.get(name) ?? 0) + 1);
      const step = funnel.indexOf(name);
      const next = step >= 0 ? funnel[step + 1] : undefined;
      if (next !== undefined && !names.has(next)) {
        nextMiss.set(name, (nextMiss.get(name) ?? 0) + 1);
      }
    }
    const last = session.events.at(-1);
    if (last) {
      lastEvent.set(last.name, (lastEvent.get(last.name) ?? 0) + 1);
    }
  }

  const total = sessions.length;
  return [...withEvent.entries()]
    .map(([name, count]) => {
      const step = funnel.indexOf(name);
      const hasNext = step >= 0 && step < funnel.length - 1;
      return {
        name,
        sessions: count,
        share: total === 0 ? 0 : count / total,
        lastRate: count === 0 ? 0 : (lastEvent.get(name) ?? 0) / count,
        nextMissRate: hasNext ? (nextMiss.get(name) ?? 0) / count : null,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
};

type FunnelRow = {
  step: string;
  sessions: number;
  /** 분모 = 집계 대상 세션 전체 */
  shareOfAll: number;
  /** 분모 = 바로 앞 단계를 지나온 세션 (첫 단계는 null) */
  fromPrevious: number | null;
};

// 퍼널은 "앞 단계를 모두 지나온 세션"만 다음 단계로 센다 — 순서는 따지지 않고 포함 여부만 본다.
const buildFunnel = (sessions: Session[], funnel: string[]): FunnelRow[] => {
  let survivors = sessions;
  const total = sessions.length;
  const rows: FunnelRow[] = [];
  for (const step of funnel) {
    const previous = survivors.length;
    survivors = survivors.filter((session) =>
      session.events.some((event) => event.name === step),
    );
    rows.push({
      step,
      sessions: survivors.length,
      shareOfAll: total === 0 ? 0 : survivors.length / total,
      fromPrevious:
        rows.length === 0
          ? null
          : previous === 0
            ? 0
            : survivors.length / previous,
    });
  }
  return rows;
};

// ── 진단 (원본 기준, 노이즈 판단 재료) ───────────────────────────────────

type Diagnosis = {
  exactDupes: number;
  deviceCounts: Map<string, number>;
  deviceNullSessions: number;
  deviceNullSingleEvent: number;
  deviceNullStartHours: Map<number, number>;
  singleEventSessions: number;
  startHours: number[];
  sizeHistogram: Map<number, number>;
  eventCounts: Map<string, number>;
};

const diagnose = (events: AnalyticsEvent[], sessions: Session[]): Diagnosis => {
  const keys = new Set<string>();
  let exactDupes = 0;
  const deviceCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();
  for (const event of events) {
    const key = eventKey(event);
    if (keys.has(key)) {
      exactDupes += 1;
    }
    keys.add(key);
    const device = event.device ?? 'null';
    deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
    eventCounts.set(event.name, (eventCounts.get(event.name) ?? 0) + 1);
  }

  const startHours = Array.from({ length: 24 }, () => 0);
  const sizeHistogram = new Map<number, number>();
  const deviceNullStartHours = new Map<number, number>();
  let deviceNullSessions = 0;
  let deviceNullSingleEvent = 0;
  let singleEventSessions = 0;

  for (const session of sessions) {
    const first = session.events[0];
    if (first === undefined) {
      continue;
    }
    const hour = hourOf(first.ts);
    startHours[hour] = (startHours[hour] ?? 0) + 1;
    sizeHistogram.set(
      session.events.length,
      (sizeHistogram.get(session.events.length) ?? 0) + 1,
    );
    if (session.events.length === 1) {
      singleEventSessions += 1;
    }
    if (session.events.every((event) => event.device === null)) {
      deviceNullSessions += 1;
      deviceNullStartHours.set(hour, (deviceNullStartHours.get(hour) ?? 0) + 1);
      if (session.events.length === 1) {
        deviceNullSingleEvent += 1;
      }
    }
  }

  return {
    exactDupes,
    deviceCounts,
    deviceNullSessions,
    deviceNullSingleEvent,
    deviceNullStartHours,
    singleEventSessions,
    startHours,
    sizeHistogram,
    eventCounts,
  };
};

type FailureRow = {
  failure: string;
  events: number;
  sessions: number;
  /** 분모 = 집계 대상 세션 전체 */
  sessionShare: number;
  /** 실패 이벤트가 세션의 마지막이었던 비율 (분모 = 실패 이벤트 수) */
  endedSession: number;
  /** 실패 직전 이벤트 분포 */
  precededBy: Map<string, number>;
};

const analyzeFailures = (
  sessions: Session[],
  failures: string[],
): FailureRow[] =>
  failures.map((failure) => {
    let count = 0;
    let ended = 0;
    const withFailure = new Set<string>();
    const precededBy = new Map<string, number>();
    for (const session of sessions) {
      session.events.forEach((event, index) => {
        if (event.name !== failure) {
          return;
        }
        count += 1;
        withFailure.add(session.id);
        if (index === session.events.length - 1) {
          ended += 1;
        }
        const previous = session.events[index - 1]?.name ?? '<세션 시작>';
        precededBy.set(previous, (precededBy.get(previous) ?? 0) + 1);
      });
    }
    return {
      failure,
      events: count,
      sessions: withFailure.size,
      sessionShare:
        sessions.length === 0 ? 0 : withFailure.size / sessions.length,
      endedSession: count === 0 ? 0 : ended / count,
      precededBy,
    };
  });

// ── 출력 ────────────────────────────────────────────────────────────────

const pct = (value: number | null) =>
  value === null ? '-' : `${(value * 100).toFixed(1)}%`;
const pad = (
  value: string | number,
  width: number,
  align: 'left' | 'right' = 'left',
) => {
  const text = String(value);
  return align === 'left' ? text.padEnd(width) : text.padStart(width);
};
const sortedEntries = <K,>(map: Map<K, number>) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]);

const renderDiagnosis = (
  d: Diagnosis,
  totalEvents: number,
  totalSessions: number,
): string[] => {
  const nullHours = sortedEntries(d.deviceNullStartHours)
    .map(([hour, count]) => `${hour}시 ${count}`)
    .join(', ');
  return [
    '## 진단 (원본 기준 — 무엇을 노이즈로 볼지는 여기서 판단한다)',
    '',
    `완전 동일 줄(sessionId·ts·name·props 일치): ${d.exactDupes} / ${totalEvents} 이벤트`,
    `device 분포: ${sortedEntries(d.deviceCounts)
      .map(([device, count]) => `${device} ${count}`)
      .join(', ')}`,
    `device null 세션: ${d.deviceNullSessions} / ${totalSessions} (이벤트 1개짜리 ${d.deviceNullSingleEvent}, 시작 시각 ${nullHours || '-'})`,
    `이벤트 1개짜리 세션: ${d.singleEventSessions} / ${totalSessions}`,
    `세션 크기 분포: ${[...d.sizeHistogram.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([size, count]) => `${size}개 ${count}`)
      .join(', ')}`,
    `세션 시작 시각(UTC) 0~23시: ${d.startHours.join(' ')}`,
    `이벤트 수(이벤트 기준, 세션 기준 아님): ${sortedEntries(d.eventCounts)
      .map(([name, count]) => `${name} ${count}`)
      .join(', ')}`,
    '',
  ];
};

const renderRanking = (
  title: string,
  rows: PathRow[],
  total: number,
  top: number,
  baseline?: PathRow[],
): string[] => {
  const baselineRank = new Map(
    baseline?.map((row, index) => [row.name, index + 1]),
  );
  const lines = [
    `## ${title}`,
    '',
    `분모(비율) = 집계 대상 세션 ${total}개. 이탈률 A = 세션 마지막 이벤트였던 비율, 이탈률 B = 퍼널 다음 단계 미도달 비율(퍼널 밖은 -).`,
    '',
    `${pad('순위', 4)} ${pad('경로(이벤트)', 24)} ${pad('세션 수', 8, 'right')} ${pad('비율', 8, 'right')} ${pad('이탈률 A', 9, 'right')} ${pad('이탈률 B', 9, 'right')}${baseline ? '  원본 순위' : ''}`,
  ];
  rows.slice(0, top).forEach((row, index) => {
    const before = baselineRank.get(row.name);
    const move =
      baseline === undefined
        ? ''
        : before === undefined
          ? '  (원본에 없음)'
          : before === index + 1
            ? `  ${before} (=)`
            : `  ${before} (${before > index + 1 ? '↑' : '↓'}${Math.abs(before - index - 1)})`;
    lines.push(
      `${pad(index + 1, 4)} ${pad(row.name, 24)} ${pad(row.sessions, 8, 'right')} ${pad(pct(row.share), 8, 'right')} ${pad(pct(row.lastRate), 9, 'right')} ${pad(pct(row.nextMissRate), 9, 'right')}${move}`,
    );
  });
  lines.push('');
  return lines;
};

const renderFunnel = (rows: FunnelRow[], total: number): string[] => [
  '## 퍼널 (앞 단계를 모두 지나온 세션만 다음 단계로 센다)',
  '',
  `분모: "전체 대비"는 집계 대상 세션 ${total}개, "앞 단계 대비"는 바로 앞 단계 통과 세션.`,
  '',
  `${pad('단계', 24)} ${pad('세션 수', 8, 'right')} ${pad('전체 대비', 10, 'right')} ${pad('앞 단계 대비', 12, 'right')}`,
  ...rows.map(
    (row) =>
      `${pad(row.step, 24)} ${pad(row.sessions, 8, 'right')} ${pad(pct(row.shareOfAll), 10, 'right')} ${pad(pct(row.fromPrevious), 12, 'right')}`,
  ),
  '',
];

const renderFailures = (rows: FailureRow[]): string[] => [
  '## 실패 비용 재료 (--fail-events로 지정한 이벤트)',
  '',
  ...rows.flatMap((row) => [
    `${row.failure}: ${row.events}건 / ${row.sessions}세션 (${pct(row.sessionShare)} of 대상 세션), 실패가 세션 마지막이었던 비율 ${pct(row.endedSession)}`,
    `  직전 이벤트: ${sortedEntries(row.precededBy)
      .map(([name, count]) => `${name} ${count}`)
      .join(', ')}`,
  ]),
  '',
];

// ── 실행 ────────────────────────────────────────────────────────────────

const parseList = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const parseInteger = (
  value: string | undefined,
  fallback: number,
  flag: string,
) => {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag}: 0 이상의 정수를 주세요 (받은 값: ${value})`);
  }
  return parsed;
};

const main = () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: 'boolean', default: false },
      'drop-dupes': { type: 'boolean', default: false },
      'drop-device-null': { type: 'boolean', default: false },
      'min-events': { type: 'string' },
      'drop-start-hours': { type: 'string' },
      'exclude-events': { type: 'string' },
      funnel: { type: 'string' },
      'fail-events': { type: 'string' },
      top: { type: 'string' },
    },
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  const file = positionals[0] ?? DEFAULT_FILE;
  const filters: Filters = {
    dropDupes: values['drop-dupes'],
    dropDeviceNull: values['drop-device-null'],
    minEvents: parseInteger(values['min-events'], 1, '--min-events'),
    dropStartHours: parseList(values['drop-start-hours']).map((hour) =>
      parseInteger(hour, 0, '--drop-start-hours'),
    ),
    excludeEvents: parseList(values['exclude-events']),
  };
  const funnel = parseList(values.funnel);
  const funnelSteps = funnel.length > 0 ? funnel : DEFAULT_FUNNEL;
  const failEvents = parseList(values['fail-events']);
  const top = parseInteger(values.top, 20, '--top');

  const events = readEvents(file);
  const rawSessions = groupSessions(events);
  const activeFilters = [
    filters.dropDupes && '--drop-dupes',
    filters.dropDeviceNull && '--drop-device-null',
    filters.minEvents > 1 && `--min-events ${filters.minEvents}`,
    filters.dropStartHours.length > 0 &&
      `--drop-start-hours ${filters.dropStartHours.join(',')}`,
    filters.excludeEvents.length > 0 &&
      `--exclude-events ${filters.excludeEvents.join(',')}`,
  ].filter((flag): flag is string => typeof flag === 'string');

  const out: string[] = [
    `# 시드 로그 집계 — ${path.relative(process.cwd(), file)}`,
    '',
    `이벤트 ${events.length}개, 세션 ${rawSessions.length}개, 기간 ${events.at(0)?.ts.slice(0, 10) ?? '-'} ~ ${events.at(-1)?.ts.slice(0, 10) ?? '-'} (UTC)`,
    `퍼널 순서: ${funnelSteps.join(' → ')}`,
    `적용 필터: ${activeFilters.length > 0 ? activeFilters.join(' ') : '없음 (원본)'}`,
    '',
    ...renderDiagnosis(
      diagnose(events, rawSessions),
      events.length,
      rawSessions.length,
    ),
  ];

  const rawRanking = rankPaths(rawSessions, funnelSteps);
  out.push(
    ...renderRanking('경로 순위 — 원본', rawRanking, rawSessions.length, top),
  );

  const sessions =
    activeFilters.length > 0 ? applyFilters(events, filters) : rawSessions;
  if (activeFilters.length > 0) {
    const eventCount = sessions.reduce(
      (sum, session) => sum + session.events.length,
      0,
    );
    out.push(
      `필터 결과: 이벤트 ${events.length} → ${eventCount} (−${events.length - eventCount}), 세션 ${rawSessions.length} → ${sessions.length} (−${rawSessions.length - sessions.length})`,
      '',
      ...renderRanking(
        '경로 순위 — 필터 적용 후',
        rankPaths(sessions, funnelSteps),
        sessions.length,
        top,
        rawRanking,
      ),
    );
  }

  out.push(
    ...renderFunnel(buildFunnel(sessions, funnelSteps), sessions.length),
  );

  if (failEvents.length > 0) {
    out.push(...renderFailures(analyzeFailures(sessions, failEvents)));
  } else {
    out.push(
      '## 실패 비용 재료',
      '',
      '--fail-events를 지정하지 않아 건너뜀. 무엇을 실패로 셀지 정한 뒤 다시 실행한다.',
      '',
    );
  }

  process.stdout.write(`${out.join('\n')}\n`);
};

main();
