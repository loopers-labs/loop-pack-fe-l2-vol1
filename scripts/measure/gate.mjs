// 서버가 필요한 판정을 한 명령으로 돌린다.
// hero.mjs는 실제 최적화가 도는 production 서버에서만 의미가 있다. 사람이 서버를 띄우고
// 기억해서 돌려야 하면 결국 안 돌린다. 서버 수명을 여기서 맡는다.
//
// 포트가 이미 쓰이고 있으면 next start는 죽고 이전 서버가 계속 응답한다. 그러면 방금 만든
// 빌드가 아니라 옛 화면을 재게 되므로, 시작 전에 비었는지부터 확인한다.

import { execFileSync, spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

// hero.mjs는 판정과 함께 산출물도 다시 쓴다. SHA를 넘기지 않으면 자리표시자가 증거에
// 박혀 어느 커밋을 잰 값인지 잃는다. 현재 HEAD를 기본값으로 둔다.
const headSha = () =>
  execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], {
    encoding: 'utf8',
  }).trim()

const PORT = Number(process.env.MEASURE_PORT ?? 3210)
const ORIGIN = `http://127.0.0.1:${PORT}`
const READY_TIMEOUT_MS = 60_000

const isPortFree = async () => {
  try {
    await fetch(ORIGIN, { signal: AbortSignal.timeout(1_000) })
    return false
  } catch {
    return true
  }
}

if (!(await isPortFree())) {
  process.stderr.write(
    `${PORT} 포트에 이미 무언가 응답한다. 그대로 두면 방금 만든 빌드가 아니라 그 서버를 재게 된다.\n` +
      `MEASURE_PORT로 다른 포트를 주거나 그 프로세스를 정리한다.\n`,
  )
  process.exit(1)
}

// npx로 띄우면 손자 프로세스가 생겨 부모만 죽여서는 서버가 남는다. 남은 서버는 다음
// 실행에서 옛 화면을 재게 만든다. 바이너리를 직접 띄우고 프로세스 그룹째 정리한다.
const server = spawn('node_modules/.bin/next', ['start', '-p', String(PORT)], {
  env: { ...process.env, APP_ORIGIN: ORIGIN },
  stdio: 'ignore',
  detached: true,
})

let stopped = false
const stop = () => {
  if (stopped) return
  stopped = true
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {
    // 이미 죽었으면 그대로 둔다.
  }
}
process.on('exit', stop)
process.on('SIGINT', () => process.exit(130))

const waitForReady = async () => {
  const deadline = Date.now() + READY_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (!(await isPortFree())) return true
    if (server.exitCode !== null) return false
    await delay(500)
  }
  return false
}

if (!(await waitForReady())) {
  process.stderr.write(
    `${ORIGIN}이 뜨지 않았다. 먼저 APP_ORIGIN=${ORIGIN} pnpm build를 돌렸는지 확인한다.\n`,
  )
  process.exit(1)
}

const gate = spawn('node', ['scripts/measure/hero.mjs'], {
  env: {
    ...process.env,
    MEASURE_BASE_URL: ORIGIN,
    MEASURE_SHA: process.env.MEASURE_SHA ?? headSha(),
  },
  stdio: 'inherit',
})

const code = await new Promise((resolve) => gate.on('close', resolve))
stop()
process.exit(code ?? 1)
