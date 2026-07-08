"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function DialogExamples() {
  return (
    <section className="mt-16">
      <DialogDemoHeader />
      <div className="grid gap-6 lg:grid-cols-3">
        <UncontrolledOrderDialog />
        <ControlledAddressDialog />
        <AsChildCouponDialog />
      </div>
      <DialogSpecNote />
    </section>
  );
}

function DialogDemoHeader() {
  return (
    <div className="mb-6">
      <p className="text-[13px] font-semibold text-[#009E30]">Compound Dialog Demo</p>
      <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-[#191919]">
        같은 Dialog 조각으로 주문 흐름 만들기
      </h1>
      <p className="mt-2 max-w-[720px] text-[13px] leading-6 text-[#767676]">
        `Dialog.Root`가 open 상태를 관리하고,
        Trigger·Portal·Overlay·Content·Title·Description·Close가 같은 Context를 공유합니다.
      </p>
    </div>
  );
}

function UncontrolledOrderDialog() {
  return (
    <DialogCard
      title="Uncontrolled"
      description="단순 확인 Dialog는 내부 상태만으로 열고 닫습니다."
    >
      <div className="rounded-[14px] bg-[#F7F7F8] p-4">
        <p className="text-[13px] font-semibold text-[#191919]">베이글 5+5개</p>
        <p className="mt-1 text-[12px] text-[#767676]">무료배송 · 내일 도착보장</p>
        <p className="mt-3 text-[22px] font-extrabold text-[#191919]">21,000원</p>
      </div>

      <Dialog.Root>
        <Dialog.Trigger className={primaryButtonClassName}>주문 확인 열기</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={overlayClassName} />
          <Dialog.Content className={contentClassName}>
            <Dialog.Title className={titleClassName}>주문을 진행할까요?</Dialog.Title>
            <Dialog.Description className={descriptionClassName}>
              선택한 베이글 세트와 배송 조건으로 결제를 계속합니다.
            </Dialog.Description>

            <div className="mt-6 rounded-[14px] border border-[#E1E1E1] bg-[#FAFAFA] p-4">
              <div className="flex justify-between text-[13px] text-[#767676]">
                <span>상품 금액</span>
                <span className="font-semibold text-[#191919]">21,000원</span>
              </div>
              <div className="mt-2 flex justify-between text-[13px] text-[#767676]">
                <span>배송비</span>
                <span className="font-semibold text-[#009E30]">무료</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className={secondaryButtonClassName}>취소</Dialog.Close>
              <Dialog.Close className={primaryButtonClassName}>결제 계속하기</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DialogCard>
  );
}

function ControlledAddressDialog() {
  const [open, setOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("집");

  return (
    <DialogCard
      title="Controlled"
      description="배송지 선택처럼 외부 상태와 연결되는 Dialog는 부모가 open을 제어합니다."
    >
      <div className="rounded-[14px] bg-[#F7F7F8] p-4">
        <p className="text-[12px] font-semibold text-[#767676]">현재 배송지</p>
        <p className="mt-1 text-[18px] font-extrabold text-[#191919]">{selectedAddress}</p>
        <p className="mt-1 text-[12px] text-[#767676]">서울시 성동구 마켓로 12</p>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={secondaryButtonClassName}>배송지 변경</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={overlayClassName} />
          <Dialog.Content className={contentClassName}>
            <Dialog.Title className={titleClassName}>배송지를 변경할까요?</Dialog.Title>
            <Dialog.Description className={descriptionClassName}>
              선택한 배송지는 Dialog 외부 상태로 저장됩니다.
            </Dialog.Description>

            <div className="mt-6 grid gap-2">
              {["집", "회사", "부모님 댁"].map((address) => (
                <button
                  key={address}
                  type="button"
                  className={getAddressButtonClassName(selectedAddress === address)}
                  onClick={() => {
                    setSelectedAddress(address);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold">{address}</span>
                  <span className="text-[12px] text-[#767676]">기본 배송 가능</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Dialog.Close className={secondaryButtonClassName}>닫기</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DialogCard>
  );
}

function AsChildCouponDialog() {
  return (
    <DialogCard
      title="asChild"
      description="Radix처럼 Dialog 조각이 직접 DOM을 만들지 않고 child에 동작 props를 주입합니다."
    >
      <div className="rounded-[14px] bg-[#F7F7F8] p-4">
        <p className="text-[12px] font-semibold text-[#767676]">적용 가능한 쿠폰</p>
        <p className="mt-1 text-[18px] font-extrabold text-[#191919]">첫 구매 3,000원 할인</p>
        <p className="mt-1 text-[12px] text-[#767676]">30,000원 이상 구매 시 사용 가능</p>
      </div>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button type="button" className={primaryButtonClassName}>
            asChild 쿠폰 Dialog
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <div className={overlayClassName} />
          </Dialog.Overlay>
          <Dialog.Content asChild>
            <section className={contentClassName}>
              <Dialog.Title asChild>
                <h3 className={titleClassName}>쿠폰을 적용할까요?</h3>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className={descriptionClassName}>
                  Trigger, Overlay, Content, Title, Description, Close가 child element를 실제
                  DOM으로 사용합니다.
                </p>
              </Dialog.Description>

              <div className="mt-6 rounded-[14px] border border-[#00C73C] bg-[#E6FBEC] p-4">
                <p className="text-[13px] font-bold text-[#009E30]">첫 구매 쿠폰</p>
                <p className="mt-1 text-[24px] font-extrabold text-[#191919]">-3,000원</p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button type="button" className={secondaryButtonClassName}>
                    다음에
                  </button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <button type="button" className={primaryButtonClassName}>
                    쿠폰 적용
                  </button>
                </Dialog.Close>
              </div>
            </section>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DialogCard>
  );
}

function DialogCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[16px] border border-[#E1E1E1] bg-white p-5 shadow-[0_4px_16px_rgba(25,25,25,0.04)]">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#009E30]">{title}</p>
      <p className="mt-2 min-h-[40px] text-[13px] leading-5 text-[#767676]">{description}</p>
      <div className="mt-5 grid gap-4">{children}</div>
    </article>
  );
}

function DialogSpecNote() {
  return (
    <div className="mt-8 rounded-[14px] border border-[#E1E1E1] bg-white px-6 py-5">
      <h2 className="text-[15px] font-bold text-[#191919]">완료조건 확인</h2>
      <p className="mt-1 text-[12.5px] leading-6 text-[#767676]">
        세 예시는 같은 compound Dialog를 사용합니다. Uncontrolled 예시는 내부 상태로 열림을
        관리하고, Controlled 예시는 부모 상태로 open을 제어합니다. asChild 예시는 Dialog 조각이
        child element에 동작 props를 주입하는 구조를 보여줍니다. Overlay와 Content는 Portal로
        렌더되며, Close·overlay click·Escape로 닫힙니다.
      </p>
    </div>
  );
}

function getAddressButtonClassName(selected: boolean) {
  const classNames = [
    "flex items-center justify-between rounded-[12px] border px-4 py-3 text-left transition",
    selected
      ? "border-[#00C73C] bg-[#E6FBEC] text-[#009E30]"
      : "border-[#E1E1E1] bg-white text-[#191919] hover:bg-[#F7F7F8]",
  ];

  return classNames.join(" ");
}

const overlayClassName = "fixed inset-0 z-40 bg-black/45";

const contentClassName =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100%-40px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] bg-white p-6 shadow-[0_24px_64px_rgba(25,25,25,0.24)]";

const titleClassName = "text-[22px] font-extrabold tracking-[-0.02em] text-[#191919]";

const descriptionClassName = "mt-2 text-[13px] leading-6 text-[#767676]";

const primaryButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-[10px] bg-[#00C73C] px-5 text-[14px] font-bold text-white transition hover:bg-[#00B236]";

const secondaryButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-[10px] border border-[#DCDCDC] bg-white px-5 text-[14px] font-bold text-[#191919] transition hover:bg-[#F7F7F8]";
