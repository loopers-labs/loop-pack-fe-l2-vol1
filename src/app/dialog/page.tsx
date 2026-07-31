"use client";

import { useState } from "react";

import { Dialog } from "@/shared/ui/dialog";

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d4dae2",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
} as const;

const primaryButtonStyle = {
  ...buttonStyle,
  border: "1px solid #4f46e5",
  background: "#4f46e5",
  color: "#fff",
} as const;

export default function DialogDemoPage() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "48px 24px",
        display: "grid",
        gap: 32,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dialog — Compound + 이중 API</h1>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>
          ① uncontrolled — 페이지는 열림 상태를 모른다
        </h2>
        <Dialog>
          <Dialog.Trigger asChild>
            <button type="button" style={primaryButtonStyle}>
              구매하기
            </button>
          </Dialog.Trigger>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>바로 구매할까요?</Dialog.Title>
            <Dialog.Description>
              선택한 옵션으로 주문서를 작성합니다. 결제 수단은 다음 단계에서 고를 수 있어요.
            </Dialog.Description>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <Dialog.Close style={buttonStyle}>취소</Dialog.Close>
              <Dialog.Close style={primaryButtonStyle}>구매</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <h2 style={{ fontSize: 15, color: "#5a6675" }}>
          ② controlled — 페이지가 열림 상태의 주인이다 (현재: {cartOpen ? "열림" : "닫힘"})
        </h2>
        <button type="button" style={buttonStyle} onClick={() => setCartOpen(true)}>
          장바구니 담기
        </button>
        <Dialog open={cartOpen} onOpenChange={setCartOpen}>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>장바구니에 담았습니다</Dialog.Title>
            <Dialog.Description>
              Esc, 오버레이 클릭, 아래 버튼 — 어느 경로로 닫아도 onOpenChange를 통해 페이지의 상태가
              함께 바뀝니다.
            </Dialog.Description>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <Dialog.Close style={buttonStyle}>계속 쇼핑</Dialog.Close>
              <button type="button" style={primaryButtonStyle} onClick={() => setCartOpen(false)}>
                장바구니 가기
              </button>
            </div>
          </Dialog.Content>
        </Dialog>
      </section>

      <p style={{ fontSize: 13, color: "#8794a3", lineHeight: 1.7 }}>
        스크롤 잠금 확인용 여백입니다. 다이얼로그가 열린 동안 이 영역으로 스크롤이 되지 않아야
        합니다.
      </p>
      <div style={{ height: "120vh" }} />
    </main>
  );
}
