// 병렬 슬롯마다 하나씩 나눠 쓰는 계정. 서버의 주문 목록은 프로세스가 사는 동안 계정별로 쌓이므로,
// 두 슬롯이 같은 계정을 쥐면 한쪽이 만든 주문이 다른 쪽의 단언에 섞인다.
//
// 기준은 workerIndex가 아니라 parallelIndex다. workerIndex는 워커 프로세스가 새로 뜰 때마다
// 계속 증가해서 --workers로 묶이지 않는다. 0..workers-1 범위를 보장하는 것은 parallelIndex다.
// 배정 근거는 docs/rfc/week09-e2e-scope.md의 「4단계 경계」에 있다.
export type TestAccount = {
  email: string
  name: string
}

export const TEST_PASSWORD = 'looper1234'

export const WORKER_ACCOUNTS: TestAccount[] = Array.from({ length: 8 }, (_, index) => ({
  email: `looper${index + 1}@loopers.dev`,
  name: `루퍼${index + 1}`,
}))

export const accountForSlot = (parallelIndex: number): TestAccount => {
  const account = WORKER_ACCOUNTS[parallelIndex]

  // 조용히 계정을 돌려쓰면 실패가 다른 테스트에서 엉뚱하게 나타난다. 여기서 멈추는 편이 낫다.
  if (account === undefined) {
    throw new Error(
      `병렬 슬롯 ${parallelIndex}에 배정할 계정이 없다. 계정이 ${WORKER_ACCOUNTS.length}개이므로 워커 수를 그 이하로 둔다.`,
    )
  }

  return account
}
