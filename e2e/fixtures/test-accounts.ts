/*
 * 브라우저 프로젝트와 병렬 슬롯마다 하나씩 계정을 나눈다. 서버의 주문 목록은 프로세스가 사는 동안
 * 계정별로 쌓이므로, 서로 다른 job·슬롯이 같은 계정을 쥐면 한쪽이 만든 주문이 다른 쪽의 단언에 섞인다.
 *
 * 기준은 workerIndex가 아니라 parallelIndex다. workerIndex는 워커 프로세스가 새로 뜰 때마다 계속
 * 증가해서 --workers로 묶이지 않지만, parallelIndex는 0..workers-1 범위를 보장한다. matrix job마다
 * parallelIndex가 0부터 다시 시작하므로 프로젝트별 offset을 더해 계정을 분리한다.
 * 배정 근거는 docs/rfc/week09-e2e-scope.md의 「4단계 경계」에 있다.
 */
export type TestAccount = {
  email: string
  name: string
}

export const TEST_PASSWORD = 'looper1234'

export const WORKER_ACCOUNTS: TestAccount[] = Array.from({ length: 8 }, (_, index) => ({
  email: `looper${index + 1}@loopers.dev`,
  name: `루퍼${index + 1}`,
}))

const PROJECT_ACCOUNT_OFFSETS: Record<string, number> = {
  chromium: 0,
  webkit: 4,
}

export const accountForProjectSlot = (projectName: string, parallelIndex: number): TestAccount => {
  const offset = PROJECT_ACCOUNT_OFFSETS[projectName]

  if (offset === undefined) {
    throw new Error(`브라우저 프로젝트 ${projectName}에 대한 계정 offset이 없다.`)
  }

  const account = WORKER_ACCOUNTS[offset + parallelIndex]

  // 조용히 계정을 돌려쓰면 실패가 다른 테스트에서 엉뚱하게 나타난다. 여기서 멈추는 편이 낫다.
  if (account === undefined) {
    throw new Error(
      `브라우저 프로젝트 ${projectName}의 병렬 슬롯 ${parallelIndex}에 배정할 계정이 없다. ` +
        `프로젝트별 워커 수와 계정 수를 확인한다.`,
    )
  }

  return account
}
