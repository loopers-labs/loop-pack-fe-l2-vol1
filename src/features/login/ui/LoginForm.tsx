'use client'

import { useEffect, useRef } from 'react'
import { APP_EVENT, type LoginEntryPoint } from '@/analytics/app-events'
import { getOrCreateFlowId } from '@/analytics/browser-context'
import { track } from '@/analytics/logger'
import { useLogin } from '@/features/login/model/useLogin'
import styles from './LoginForm.module.css'

type LoginFormProps = {
  returnPath: string
  entryPoint: LoginEntryPoint
  productId?: string
}

export const LoginForm = ({ returnPath, entryPoint, productId }: LoginFormProps) => {
  const hasTrackedStartRef = useRef(false)
  const { login, isPending, error } = useLogin({ returnPath })

  useEffect(() => {
    if (hasTrackedStartRef.current) {
      return
    }

    hasTrackedStartRef.current = true
    // flow id는 sessionStorage에 있다. 렌더 중에 만들면 서버 렌더가 window를 찾다가 터지므로
    // 마운트 이후인 여기서 만든다. 제출 결과 이벤트는 이 값을 다시 읽어 같은 흐름으로 묶인다.
    track(APP_EVENT.loginStart, {
      flow_id: getOrCreateFlowId(),
      entry_point: entryPoint,
      return_path: returnPath,
      ...(productId === undefined ? {} : { product_id: productId }),
    })
  }, [entryPoint, productId, returnPath])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 폼 요소에서 직접 읽는다. 입력값을 state로 들어 렌더마다 동기화할 이유가 없다.
    const formData = new FormData(event.currentTarget)
    login({
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        이메일
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label className={styles.field}>
        비밀번호
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? '로그인 중…' : '로그인'}
      </button>
      {/*
        오류 영역은 한 자리에 고정한다. 자격 증명 불일치(401)와 본문 형식 오류(400)가
        같은 자리에 뜨고, role="alert"라 스크린리더와 E2E가 같은 것을 본다.
      */}
      <p className={styles.error} role="alert">
        {error === null ? '' : error.message}
      </p>
    </form>
  )
}
