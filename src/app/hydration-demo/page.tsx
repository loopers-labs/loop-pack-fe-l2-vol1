'use client'

import { useCartStore } from '@/store/cartStore'

// 개발용 데모(/hydration-demo). 영속 store를 SSR에서 읽을 때 hydration 불일치가
// 언제 나는지/안 나는지를 비교한다. 확인 후 삭제해도 되는 라우트.
//
// 결론(실측): 훅으로 읽으면(A) 불일치가 없고, 렌더 중 getState()로 직접 읽으면(B) 불일치가 난다.
// zustand 훅은 getServerSnapshot을 "초기 상태"로 돌려줘 hydration 렌더가 서버와 일치하기 때문이다.
// 그래서 훅만 쓰면 별도의 hydration 가드는 필요 없다.

const DEMO_ID = 'demo-item'

// A. 훅으로 읽기 → 안전. getServerSnapshot(초기 0)으로 hydration 렌더가 서버와 일치.
const HookCount = () => {
  const count = useCartStore((state) => state.ids.length)
  return <strong style={{ fontSize: 40 }}>{count}</strong>
}

// B. 렌더 중 getState() 직접 읽기 → 불일치. 훅의 getServerSnapshot 보호를 우회해
//    서버는 초기값(0), 클라 hydration 렌더는 복원값(1)이 되어 어긋난다.
const GetStateCount = () => {
  const count = useCartStore.getState().ids.length
  return <strong style={{ fontSize: 40 }}>{count}</strong>
}

const panel: React.CSSProperties = {
  flex: 1,
  padding: 20,
  border: '1px solid #c8c8c8',
  borderRadius: 8,
  textAlign: 'center',
}

export default function HydrationDemo() {
  const add = () => useCartStore.getState().toggle(DEMO_ID)
  const clear = () => useCartStore.setState({ ids: [] })

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, lineHeight: 1.6 }}>
      <h1>Hydration 불일치 데모</h1>
      <ol>
        <li>
          <b>담기</b>를 눌러 장바구니에 항목을 넣는다(localStorage 저장).
        </li>
        <li>
          <b>새로고침(F5)</b> 한다.
        </li>
        <li>
          B(getState 직접 읽기) 쪽만 콘솔/Next 오버레이에 hydration 경고가 뜬다. A(훅)는 조용하다.
        </li>
      </ol>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button type="button" onClick={add}>
          담기 (demo-item 토글)
        </button>
        <button type="button" onClick={clear}>
          비우기
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <section style={panel}>
          <p>A. 훅으로 읽기</p>
          <HookCount />
          <p style={{ color: '#070' }}>불일치 없음 (안전)</p>
        </section>
        <section style={{ ...panel, borderColor: '#b00' }}>
          <p>B. getState() 직접 읽기</p>
          <GetStateCount />
          <p style={{ color: '#b00' }}>hydration 불일치 발생</p>
        </section>
      </div>
    </main>
  )
}
