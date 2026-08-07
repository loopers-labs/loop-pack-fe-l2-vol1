// Dialog 사용처 예시 — 같은 compound 조립으로 uncontrolled/controlled 둘 다 보여준다.
// 상태를 넘기는(useState) 쪽이라 "use client".
"use client";
import { useState } from "react";
import { Dialog } from "@/shared/ui/dialog";

export function DialogExample() {
  // controlled: open을 바깥이 소유. Dialog.Trigger 말고 "바깥 버튼"으로도 열려서
  // 상태의 주인이 바깥임을 눈으로 확인할 수 있다(= 이중 API의 controlled 쪽).
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      {/* uncontrolled — Dialog가 열림 상태를 스스로 관리 */}
      <Dialog>
        <Dialog.Trigger>주문 (uncontrolled)</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>주문 확인</Dialog.Title>
          <Dialog.Description>이대로 결제할까요?</Dialog.Description>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>

      {/* controlled — 열림 상태를 바깥 state가 소유 (open prop 존재로 판별) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger>알림 (controlled)</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>알림</Dialog.Title>
          <Dialog.Description>이 다이얼로그는 바깥 state가 여닫습니다.</Dialog.Description>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>

      {/* controlled라서 Dialog 트리 바깥에서도 열 수 있다 */}
      <button type="button" onClick={() => setOpen(true)}>
        바깥 버튼으로 알림 열기
      </button>
    </div>
  );
}
