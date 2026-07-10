'use client'

// Dialog 데모 — 같은 compound 조각으로 uncontrolled/controlled 두 사용법을 보인다.

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'

const actionButtonStyle = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #d9dee5',
  background: '#fff',
  font: 'inherit',
  cursor: 'pointer',
} as const

export default function DialogShowcase() {
  // controlled 데모 — 열림 상태의 진실이 이 컴포넌트에 있다.
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {/* uncontrolled — open prop을 주지 않으면 Dialog가 스스로 상태를 쥔다 */}
      <Dialog>
        <Dialog.Trigger style={actionButtonStyle}>
          배송 안내 (uncontrolled)
        </Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title style={{ margin: '0 0 8px', fontSize: 18 }}>
            배송 안내
          </Dialog.Title>
          <Dialog.Description style={{ margin: '0 0 16px', color: '#5a6675' }}>
            오후 2시 이전 주문은 당일 출고돼요. Esc나 바깥 클릭으로도 닫을 수
            있어요.
          </Dialog.Description>
          <Dialog.Close style={actionButtonStyle}>확인</Dialog.Close>
        </Dialog.Content>
      </Dialog>

      {/* controlled — open prop이 있으면 Dialog는 상태를 만들지 않고 통지만 한다 */}
      <button
        type="button"
        style={actionButtonStyle}
        onClick={() => setOrderDialogOpen(true)}
      >
        주문 확인 (controlled{orderDialogOpen ? ' · open' : ' · closed'})
      </button>
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title style={{ margin: '0 0 8px', fontSize: 18 }}>
            이대로 주문할까요?
          </Dialog.Title>
          <Dialog.Description style={{ margin: '0 0 16px', color: '#5a6675' }}>
            열림 상태를 부모가 쥐고 있어서, Esc·오버레이 클릭도 onOpenChange를
            거쳐 닫혀요.
          </Dialog.Description>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={{
                ...actionButtonStyle,
                background: '#18212e',
                color: '#fff',
              }}
              onClick={() => setOrderDialogOpen(false)}
            >
              주문하기
            </button>
            <Dialog.Close style={actionButtonStyle}>취소</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  )
}
