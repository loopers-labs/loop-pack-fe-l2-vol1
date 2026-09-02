import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = resolve(process.argv[2] ?? 'fixtures/events-30d.jsonl');
const rows = readFileSync(inputPath, 'utf8').trim().split(/\r?\n/);
const events = rows.map((row, index) => {
  const event = JSON.parse(row);
  return { ...event, index, time: Date.parse(event.ts) };
});

const expectedEventNames = new Set([
  'product_list_view',
  'category_filter_change',
  'sort_change',
  'page_change',
  'product_detail_view',
  'cart_add',
  'wishlist_add',
  'login_start',
  'login_success',
  'login_fail',
  'order_start',
  'order_complete',
  'client_error',
]);
const funnelStages = [
  'product_list_view',
  'product_detail_view',
  'cart_add',
  'login_start',
  'login_success',
  'order_start',
  'order_complete',
];
const milestoneNames = new Set([...funnelStages, 'login_fail']);

function groupSessions(sourceEvents) {
  const grouped = Map.groupBy(sourceEvents, (event) => event.sessionId);
  return [...grouped.entries()].map(([sessionId, sessionEvents]) => ({
    sessionId,
    events: sessionEvents.toSorted(
      (left, right) => left.time - right.time || left.index - right.index,
    ),
  }));
}

function exactEventKey(event) {
  return JSON.stringify({
    sessionId: event.sessionId,
    ts: event.ts,
    name: event.name,
    props: event.props,
    userId: event.userId ?? null,
    device: event.device ?? null,
  });
}

function isScheduledBotSession(session) {
  if (session.events.length !== 1) return false;

  const [event] = session.events;
  const timestamp = new Date(event.time);
  return (
    event.device === null &&
    event.name === 'product_list_view' &&
    event.props.category === 'all' &&
    event.props.sort === 'latest' &&
    event.props.page === 1 &&
    event.ts.endsWith('.000Z') &&
    timestamp.getUTCHours() === 1
  );
}

function roundRate(numerator, denominator) {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function countValues(values) {
  return [...Map.groupBy(values, (value) => String(value)).entries()]
    .map(([value, grouped]) => ({ value, count: grouped.length }))
    .toSorted(
      (left, right) =>
        right.count - left.count || left.value.localeCompare(right.value),
    );
}

function getEventStats(sourceEvents, sourceSessions) {
  return [...Map.groupBy(sourceEvents, (event) => event.name).entries()]
    .map(([name, grouped]) => ({
      name,
      events: grouped.length,
      sessions: new Set(grouped.map((event) => event.sessionId)).size,
      sessionRatio: roundRate(
        new Set(grouped.map((event) => event.sessionId)).size,
        sourceSessions.length,
      ),
    }))
    .toSorted(
      (left, right) =>
        right.sessions - left.sessions || right.events - left.events,
    )
    .map((stat, index) => ({ rank: index + 1, ...stat }));
}

function firstEventIndex(session, name) {
  return session.events.findIndex((event) => event.name === name);
}

function hasLaterEvent(session, fromName, toName) {
  const fromIndex = firstEventIndex(session, fromName);
  return (
    fromIndex >= 0 &&
    session.events.some(
      (event, index) => index > fromIndex && event.name === toName,
    )
  );
}

function buildFunnel(sourceSessions) {
  return funnelStages.map((name, index) => {
    const reached = sourceSessions.filter(
      (session) => firstEventIndex(session, name) >= 0,
    );
    const nextName = funnelStages[index + 1];
    const continued = nextName
      ? reached.filter((session) => hasLaterEvent(session, name, nextName)).length
      : null;
    const conversionRate =
      continued === null ? null : roundRate(continued, reached.length);

    return {
      name,
      sessions: reached.length,
      allCleanSessionsRatio: roundRate(reached.length, sourceSessions.length),
      next: nextName ?? null,
      continuedSessions: continued,
      nextStepConversionRate: conversionRate,
      nextStepDropoutRate:
        conversionRate === null
          ? null
          : Math.round((100 - conversionRate) * 100) / 100,
    };
  });
}

function getMilestoneSequences(sourceSessions) {
  const sequences = sourceSessions.map((session) =>
    session.events
      .filter((event) => milestoneNames.has(event.name))
      .map((event) => event.name)
      .filter((name, index, names) => name !== names[index - 1])
      .join(' > '),
  );

  return countValues(sequences).slice(0, 20).map(({ value, count }) => ({
    sequence: value,
    sessions: count,
    ratio: roundRate(count, sourceSessions.length),
  }));
}

const rawSessions = groupSessions(events);
const botSessions = rawSessions.filter(isScheduledBotSession);
const botSessionIds = new Set(botSessions.map((session) => session.sessionId));
const humanCandidateEvents = events.filter(
  (event) => !botSessionIds.has(event.sessionId),
);
const exactDuplicateGroups = [
  ...Map.groupBy(humanCandidateEvents, exactEventKey).values(),
];
const exactDuplicateRows = exactDuplicateGroups.reduce(
  (count, group) => count + Math.max(0, group.length - 1),
  0,
);
const seenEventKeys = new Set();
const cleanEvents = humanCandidateEvents.filter((event) => {
  const key = exactEventKey(event);
  if (seenEventKeys.has(key)) return false;
  seenEventKeys.add(key);
  return true;
});
const cleanSessions = groupSessions(cleanEvents);

const rawStats = getEventStats(events, rawSessions);
const cleanStats = getEventStats(cleanEvents, cleanSessions);
const rankComparison = cleanStats.map((cleanStat) => {
  const rawStat = rawStats.find((stat) => stat.name === cleanStat.name);
  return {
    name: cleanStat.name,
    rawRank: rawStat.rank,
    cleanRank: cleanStat.rank,
    rankChange: rawStat.rank - cleanStat.rank,
    rawEvents: rawStat.events,
    cleanEvents: cleanStat.events,
    rawSessions: rawStat.sessions,
    cleanSessions: cleanStat.sessions,
    rawSessionRatio: rawStat.sessionRatio,
    cleanSessionRatio: cleanStat.sessionRatio,
  };
});

const detailSessions = cleanSessions.filter(
  (session) => firstEventIndex(session, 'product_detail_view') >= 0,
);
const clientErrorSessions = detailSessions.filter((session) =>
  hasLaterEvent(session, 'product_detail_view', 'client_error'),
);
const detailWithoutClientErrorSessions = detailSessions.filter(
  (session) => !hasLaterEvent(session, 'product_detail_view', 'client_error'),
);
const loginStartSessions = cleanSessions.filter(
  (session) => firstEventIndex(session, 'login_start') >= 0,
);
const loginFailSessions = loginStartSessions.filter((session) =>
  hasLaterEvent(session, 'login_start', 'login_fail'),
);
const recoveredLoginSessions = loginFailSessions.filter((session) =>
  hasLaterEvent(session, 'login_fail', 'login_success'),
);
const orderStartSessions = cleanSessions.filter(
  (session) => firstEventIndex(session, 'order_start') >= 0,
);

const deviceSessionGroups = Map.groupBy(cleanSessions, (session) => {
  const devicesInSession = new Set(
    session.events.map((event) => event.device),
  );
  return devicesInSession.size === 1
    ? String([...devicesInSession][0])
    : 'mixed';
});
const devices = [...deviceSessionGroups.entries()]
  .map(([device, sessions]) => ({
    device,
    sessions: sessions.length,
    ratio: roundRate(sessions.length, cleanSessions.length),
    detailReachRate: roundRate(
      sessions.filter(
        (session) => firstEventIndex(session, 'product_detail_view') >= 0,
      ).length,
      sessions.length,
    ),
    cartReachRate: roundRate(
      sessions.filter((session) => firstEventIndex(session, 'cart_add') >= 0)
        .length,
      sessions.length,
    ),
    orderCompleteRate: roundRate(
      sessions.filter(
        (session) => firstEventIndex(session, 'order_complete') >= 0,
      ).length,
      sessions.length,
    ),
  }))
  .toSorted((left, right) => right.sessions - left.sessions);

const botDates = new Set(
  botSessions.map((session) => session.events[0].ts.slice(0, 10)),
);
const result = {
  overview: {
    inputPath,
    period: {
      first: events.reduce(
        (minimum, event) => (event.ts < minimum ? event.ts : minimum),
        events[0].ts,
      ),
      last: events.reduce(
        (maximum, event) => (event.ts > maximum ? event.ts : maximum),
        events[0].ts,
      ),
      calendarDays: new Set(events.map((event) => event.ts.slice(0, 10))).size,
    },
    rawEvents: events.length,
    rawSessions: rawSessions.length,
    identifiedUsers: new Set(events.flatMap((event) => event.userId ?? []))
      .size,
    unknownEventNames: [
      ...new Set(
        events
          .filter((event) => !expectedEventNames.has(event.name))
          .map((event) => event.name),
      ),
    ],
    invalidTimestamps: events.filter((event) => Number.isNaN(event.time))
      .length,
    mixedDeviceSessions: rawSessions.filter(
      (session) =>
        new Set(session.events.map((event) => event.device)).size > 1,
    ).length,
  },
  cleaning: {
    botCriterion:
      '단일 product_list_view, 기본 조건(all/latest/1), device=null, 밀리초 .000, UTC 01시',
    botSessions: botSessions.length,
    botEvents: botSessions.reduce(
      (count, session) => count + session.events.length,
      0,
    ),
    botCalendarDays: botDates.size,
    botTimeWindowUtc: '01:00:00-01:14:59',
    duplicateCriterion:
      'sessionId, ts, name, props, userId, device가 모두 같은 행은 첫 행만 유지',
    duplicateGroups: exactDuplicateGroups.filter((group) => group.length > 1)
      .length,
    duplicateRowsRemoved: exactDuplicateRows,
    duplicateEventsByName: countValues(
      exactDuplicateGroups.flatMap((group) =>
        group.length > 1
          ? Array.from({ length: group.length - 1 }, () => group[0].name)
          : [],
      ),
    ),
    cleanEvents: cleanEvents.length,
    cleanSessions: cleanSessions.length,
    eventRemovalRate: roundRate(events.length - cleanEvents.length, events.length),
    sessionRemovalRate: roundRate(
      rawSessions.length - cleanSessions.length,
      rawSessions.length,
    ),
  },
  eventStats: cleanStats,
  rankComparison,
  funnel: buildFunnel(cleanSessions),
  failures: {
    productDetail: {
      reachedSessions: detailSessions.length,
      clientErrorSessions: clientErrorSessions.length,
      explicitClientErrorRate: roundRate(
        clientErrorSessions.length,
        detailSessions.length,
      ),
      errorCodes: countValues(
        cleanEvents
          .filter((event) => event.name === 'client_error')
          .map((event) => event.props.code),
      ),
      cartConversionWithClientError: roundRate(
        clientErrorSessions.filter((session) =>
          hasLaterEvent(session, 'product_detail_view', 'cart_add'),
        ).length,
        clientErrorSessions.length,
      ),
      cartConversionWithoutClientError: roundRate(
        detailWithoutClientErrorSessions.filter((session) =>
          hasLaterEvent(session, 'product_detail_view', 'cart_add'),
        ).length,
        detailWithoutClientErrorSessions.length,
      ),
    },
    login: {
      startedSessions: loginStartSessions.length,
      failedSessions: loginFailSessions.length,
      explicitFailureRate: roundRate(
        loginFailSessions.length,
        loginStartSessions.length,
      ),
      recoveredAfterFailureSessions: recoveredLoginSessions.length,
      recoveryRateAfterFailure: roundRate(
        recoveredLoginSessions.length,
        loginFailSessions.length,
      ),
      noSuccessSessions: loginStartSessions.filter(
        (session) => !hasLaterEvent(session, 'login_start', 'login_success'),
      ).length,
      failureReasons: countValues(
        cleanEvents
          .filter((event) => event.name === 'login_fail')
          .map((event) => event.props.reason),
      ),
    },
    order: {
      startedSessions: orderStartSessions.length,
      completedSessions: orderStartSessions.filter((session) =>
        hasLaterEvent(session, 'order_start', 'order_complete'),
      ).length,
      incompleteSessions: orderStartSessions.filter(
        (session) => !hasLaterEvent(session, 'order_start', 'order_complete'),
      ).length,
      incompleteRate: roundRate(
        orderStartSessions.filter(
          (session) => !hasLaterEvent(session, 'order_start', 'order_complete'),
        ).length,
        orderStartSessions.length,
      ),
      explicitOrderErrorEvents: cleanEvents.filter((event) =>
        ['order_fail', 'order_error'].includes(event.name),
      ).length,
    },
  },
  devices,
  milestoneSequences: getMilestoneSequences(cleanSessions),
  propertyDistributions: {
    categoryFilter: countValues(
      cleanEvents
        .filter((event) => event.name === 'category_filter_change')
        .map((event) => event.props.category),
    ),
    sort: countValues(
      cleanEvents
        .filter((event) => event.name === 'sort_change')
        .map((event) => event.props.sort),
    ),
    page: countValues(
      cleanEvents
        .filter((event) => event.name === 'page_change')
        .map((event) => event.props.page),
    ),
    cartQuantity: countValues(
      cleanEvents
        .filter((event) => event.name === 'cart_add')
        .map((event) => event.props.quantity),
    ),
  },
};

console.log(JSON.stringify(result, null, 2));
