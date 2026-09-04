import path from 'node:path'
import type { AuthUser } from '@/entities/session'
import { accounts } from '@/entities/session/server'

function getAccountIndex(parallelIndex: number): number {
  if (accounts.length === 0) {
    throw new Error('E2E 인증에 사용할 계정이 없습니다.')
  }

  return parallelIndex % accounts.length
}

export function getWorkerAccount(parallelIndex: number): AuthUser {
  const account = accounts[getAccountIndex(parallelIndex)]
  if (account === undefined) {
    throw new Error(`E2E worker ${parallelIndex}의 계정을 찾을 수 없습니다.`)
  }

  return account
}

export function getAuthStatePath(parallelIndex: number): string {
  const accountIndex = getAccountIndex(parallelIndex)
  return path.resolve('test-results', '.auth', `worker-${accountIndex}.json`)
}
