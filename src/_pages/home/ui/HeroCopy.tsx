import { connection } from 'next/server'
import type { JSX } from 'react'
import { getServerQueryClient } from '@/shared/api/getServerQueryClient'
import { homeQueryOptions } from '../api/queries'
import styles from './HeroSection.module.css'

// hero 문구만 홈 데이터를 기다린다. connection()으로 지연을 build가 아니라
// 요청 시점에 재현한다 — 그렇지 않으면 1.5초가 빌드 때 한 번 끝나 실습 조건이 사라진다.
export async function HeroCopy(): Promise<JSX.Element> {
  await connection()
  const queryClient = getServerQueryClient()
  const { banner } = await queryClient.fetchQuery(homeQueryOptions())

  return (
    <>
      <p className={styles.eyebrow}>이번 주의 발견</p>
      <h2 id="week07-hero-title">{banner.title}</h2>
      <p>{banner.description}</p>
    </>
  )
}
