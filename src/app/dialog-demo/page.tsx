'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Dialog } from '@/components/ui/dialog';

// 같은 Dialog인데, ①은 상태를 스스로 들고(uncontrolled), ②는 부모가 든다(controlled).
// open prop 유무 하나로 소유자가 갈린다 — 이번 주의 알맹이.

export default function DialogDemoPage() {
  const [open, setOpen] = useState(false);

  return (
    <main
      style={{ maxWidth: 560, margin: '0 auto', padding: '56px 20px 96px' }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Dialog (Compound)
      </h1>
      <p style={{ color: '#5a6675', lineHeight: 1.7, marginBottom: 32 }}>
        같은 <code>Dialog</code>인데 하나는 상태를 <b>스스로</b> 들고, 하나는{' '}
        <b>부모</b>가 듭니다. <code>open</code> prop 유무로 갈려요. Esc·오버레이
        클릭으로 닫히고, 열린 동안 배경 스크롤이 잠깁니다.
      </p>

      {/* ① Uncontrolled — Dialog가 상태 소유 */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={h2}>① Uncontrolled — Dialog가 상태 소유 (open prop 없음)</h2>
        <Dialog>
          <Dialog.Trigger style={btn}>배송지 삭제…</Dialog.Trigger>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title style={titleStyle}>배송지 삭제</Dialog.Title>
            <Dialog.Description style={descStyle}>
              이 주소를 삭제할까요? 되돌릴 수 없어요.
            </Dialog.Description>
            <div style={rowRight}>
              <Dialog.Close style={btnGhost}>취소</Dialog.Close>
              <Dialog.Close style={btnDanger}>삭제</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog>
      </section>

      {/* ② Controlled — 부모가 상태 소유 */}
      <section>
        <h2 style={h2}>
          ② Controlled — 부모가 상태 소유 (open · onOpenChange)
        </h2>
        <p style={{ color: '#5a6675', marginBottom: 12 }}>
          부모 상태: <b>{open ? '열림' : '닫힘'}</b>
        </p>
        <button type="button" style={btn} onClick={() => setOpen(true)}>
          부모 버튼으로 열기
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title style={titleStyle}>쿠폰 적용</Dialog.Title>
            <Dialog.Description style={descStyle}>
              부모가 <code>open</code>을 들고 있어요. Esc·오버레이·닫기 어느
              쪽으로 닫아도 위 “부모 상태”가 항상 <b>열림/닫힘</b>과 일치합니다
              (onOpenChange가 모든 닫힘 경로에서 부모에 알림).
            </Dialog.Description>
            <div style={rowRight}>
              <Dialog.Close style={btnGhost}>닫기</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog>
      </section>
    </main>
  );
}

const h2: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#18212e',
  marginBottom: 12,
};
const btn: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #d5dae1',
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
const btnGhost: CSSProperties = {
  padding: '9px 16px',
  borderRadius: 8,
  border: '1px solid #d5dae1',
  background: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
const btnDanger: CSSProperties = {
  padding: '9px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#ff4d4f',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 8,
  color: '#111',
};
const descStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: '#5a6675',
  marginBottom: 20,
};
const rowRight: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};
