'use client';

import { useState, type CSSProperties } from 'react';
import { Dialog } from './index';

export function DialogPlayground() {
  const [controlledOpen, setControlledOpen] = useState(false);

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dialog Playground</h1>
      <p style={{ fontSize: 13, color: '#8794a3', marginBottom: 32, lineHeight: 1.6 }}>
        Compound 조립 + 이중 API(controlled/uncontrolled)를 테스트합니다. 모든 스타일은 사용처(이
        컴포넌트)에서 주입합니다 — Dialog 자체는 스타일이 없는 headless 컴포넌트입니다.
      </p>

      {/* ─── 1) Uncontrolled ─── */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, color: '#5a6675', marginBottom: 8 }}>
          1) Uncontrolled (내부 상태)
        </h2>
        <Dialog>
          <Dialog.Trigger style={triggerStyle}>열기</Dialog.Trigger>
          <Dialog.Overlay style={overlayStyle} />
          <Dialog.Content style={contentStyle}>
            <Dialog.Title style={titleStyle}>비밀 메시지</Dialog.Title>
            <Dialog.Description style={descriptionStyle}>
              이 다이얼로그는 스스로 열리고 닫힙니다. 부모는 관여하지 않아요.
            </Dialog.Description>
            <Dialog.Close style={closeStyle}>닫기</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </section>

      {/* ─── 2) Controlled ─── */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, color: '#5a6675', marginBottom: 8 }}>
          2) Controlled (부모 소유)
        </h2>
        <Dialog open={controlledOpen} onOpenChange={setControlledOpen}>
          <button
            type="button"
            onClick={() => setControlledOpen(true)}
            style={{ ...triggerStyle, marginRight: 8 }}
          >
            외부 버튼으로 열기
          </button>

          <Dialog.Overlay style={overlayStyle} />
          <Dialog.Content style={contentStyle}>
            <Dialog.Title style={titleStyle}>부모가 제어 중</Dialog.Title>
            <Dialog.Description style={descriptionStyle}>
              isOpen 상태: <code>{String(controlledOpen)}</code>
              <br />
              외부 버튼이나 닫기 버튼으로 닫을 수 있어요.
            </Dialog.Description>
            <Dialog.Close style={closeStyle}>닫기</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </section>

      {/* ─── 3) defaultOpen ─── */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, color: '#5a6675', marginBottom: 8 }}>
          3) defaultOpen (초기에 열려있음)
        </h2>
        <Dialog defaultOpen>
          <Dialog.Overlay style={overlayStyle} />
          <Dialog.Content style={contentStyle}>
            <Dialog.Title style={titleStyle}>처음부터 열려있음</Dialog.Title>
            <Dialog.Description style={descriptionStyle}>
              uncontrolled 모드지만 mount 시점에 열려 있습니다.
            </Dialog.Description>
            <Dialog.Close style={closeStyle}>닫기</Dialog.Close>
          </Dialog.Content>
        </Dialog>
        <p style={{ fontSize: 12, color: '#8794a3', marginTop: 8 }}>
          ↑ 페이지 진입 시 이미 열려있습니다.
        </p>
      </section>

      <section
        style={{
          marginTop: 32,
          padding: 16,
          background: '#f5f7fa',
          borderRadius: 8,
          fontSize: 12,
          color: '#5a6675',
          lineHeight: 1.7,
        }}
      >
        <strong>체크리스트</strong>
        <ul style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>Overlay 클릭 → 닫힘</li>
          <li>Esc 키 → 닫힘</li>
          <li>열린 동안 배경 스크롤 잠금</li>
          <li>Content는 DOM 트리의 body 끝에 렌더됨 (개발자 도구 확인)</li>
          <li>Controlled 모드: 외부 버튼으로도 열림</li>
        </ul>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// 스타일 — 전부 사용처(Playground)에서 정의
// Dialog 자체는 스타일이 없으므로, 다른 사용처에서는 전혀 다른 스타일을
// 줄 수도 있다. 이게 Headless 패턴의 힘.
// ─────────────────────────────────────────────────────────────
const triggerStyle: CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #d0d6de',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 40,
};

const contentStyle: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#fff',
  padding: 24,
  borderRadius: 8,
  zIndex: 50,
  minWidth: 320,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 18,
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  marginBottom: 16,
  color: '#5a6675',
  fontSize: 14,
  lineHeight: 1.6,
};

const closeStyle: CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: 6,
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};
