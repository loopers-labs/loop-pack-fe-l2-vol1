'use client';

import { useState, type FormEvent } from 'react';

import { Dialog } from '@/components/ui/dialog/Dialog';

const triggerClassName =
  'cursor-pointer rounded-lg border border-[#d0d5db] bg-white px-4 py-2.5 text-sm font-medium';

const overlayClassName = 'fixed inset-0 z-50 bg-black/40';

const contentClassName =
  'fixed top-1/2 left-1/2 z-50 w-100 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl';

const titleClassName = 'text-lg font-bold';

const descriptionClassName = 'mt-1.5 text-sm text-[#5a6675]';

const primaryButtonClassName =
  'cursor-pointer rounded-lg bg-[#111] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40';

const secondaryButtonClassName =
  'cursor-pointer rounded-lg border border-[#d0d5db] bg-white px-4 py-2.5 text-sm font-medium';

const textareaClassName =
  'mt-4 w-full resize-none rounded-lg border border-[#d0d5db] p-3 text-sm';

// 기본 컨텐츠 — uncontrolled. 조각 조립(Trigger/Overlay/Content/Title/Description/Close)만으로 완성되는 기본형
function BasicDialogDemo() {
  return (
    <Dialog>
      <Dialog.Trigger className={triggerClassName}>
        배송·교환 안내 보기
      </Dialog.Trigger>

      <Dialog.Overlay className={overlayClassName} />

      <Dialog.Content className={contentClassName}>
        <Dialog.Title className={titleClassName}>배송·교환 안내</Dialog.Title>
        <Dialog.Description className={descriptionClassName}>
          주문 전에 확인해 주세요.
        </Dialog.Description>
        <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-5 text-sm text-[#18212e]">
          <li>오후 2시 이전 결제 시 당일 출고돼요.</li>
          <li>단순 변심 교환·반품은 수령 후 7일 이내 가능해요.</li>
          <li>맞춤 제작 상품은 제작 시작 후 취소가 어려워요.</li>
        </ul>
        <div className="mt-5 flex justify-end">
          <Dialog.Close className={primaryButtonClassName}>확인</Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

// Form — Radix 'close after async form submission' 패턴. 저장이 끝난 뒤에만 controlled로 닫는다
function FormDialogDemo() {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReview, setSavedReview] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const review = String(new FormData(event.currentTarget).get('review'));
    setIsSaving(true);

    // 저장 API 흉내 — 완료 후에만 닫아 "제출했는데 저장 안 됨"을 막는다
    setTimeout(() => {
      setSavedReview(review);
      setIsSaving(false);
      setOpen(false);
    }, 600);
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={triggerClassName}>리뷰 작성</Dialog.Trigger>

        <Dialog.Overlay className={overlayClassName} />

        <Dialog.Content className={contentClassName}>
          <Dialog.Title className={titleClassName}>리뷰 작성</Dialog.Title>
          <Dialog.Description className={descriptionClassName}>
            상품은 어떠셨나요? 저장이 끝나면 자동으로 닫혀요.
          </Dialog.Description>

          <form onSubmit={handleSubmit}>
            <textarea
              name="review"
              required
              rows={4}
              placeholder="리뷰를 입력해 주세요"
              className={textareaClassName}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className={secondaryButtonClassName}>
                취소
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSaving}
                className={primaryButtonClassName}
              >
                {isSaving ? '저장 중…' : '저장'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog>

      <p className="mt-3 text-sm text-[#5a6675]">
        {savedReview ? `저장된 리뷰: ${savedReview}` : '저장된 리뷰 없음'}
      </p>
    </div>
  );
}

// Nested — Dialog 안에서 또 하나의 Dialog를 연다. ESC/오버레이는 dialogStack 최상단부터 닫힌다
function NestedDialogDemo() {
  return (
    <Dialog>
      <Dialog.Trigger className={triggerClassName}>
        장바구니에 담기
      </Dialog.Trigger>

      <Dialog.Overlay className={overlayClassName} />

      <Dialog.Content className={contentClassName}>
        <Dialog.Title className={titleClassName}>
          장바구니에 담았어요
        </Dialog.Title>
        <Dialog.Description className={descriptionClassName}>
          지금 적용할 수 있는 쿠폰이 있어요. ESC는 위에 있는 Dialog부터 닫혀요.
        </Dialog.Description>

        <div className="mt-5 flex justify-end gap-2">
          <Dialog.Close className={secondaryButtonClassName}>
            계속 쇼핑
          </Dialog.Close>

          <Dialog>
            <Dialog.Trigger className={primaryButtonClassName}>
              쿠폰 확인
            </Dialog.Trigger>

            <Dialog.Overlay className={overlayClassName} />

            <Dialog.Content className={contentClassName}>
              <Dialog.Title className={titleClassName}>
                사용 가능한 쿠폰
              </Dialog.Title>
              <ul className="mt-4 flex list-none flex-col gap-2 text-sm">
                <li className="rounded-lg border border-[#e0e0e0] px-4 py-3">
                  신규 가입 10% 할인
                </li>
                <li className="rounded-lg border border-[#e0e0e0] px-4 py-3">
                  3만원 이상 무료배송
                </li>
              </ul>
              <div className="mt-5 flex justify-end">
                <Dialog.Close className={primaryButtonClassName}>
                  닫기
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

// Close confirmation — Base UI 예시 차용. 작성 중 내용이 있으면 닫기 요청(ESC·오버레이·버튼)을
// onOpenChange에서 가로채 확인 Dialog를 중첩으로 띄운다
function CloseConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && draft !== '') {
      setConfirmOpen(true);

      return;
    }

    setOpen(nextOpen);
  };

  const discardAndClose = () => {
    setDraft('');
    setConfirmOpen(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger className={triggerClassName}>
        1:1 문의 작성
      </Dialog.Trigger>

      <Dialog.Overlay className={overlayClassName} />

      <Dialog.Content className={contentClassName}>
        <Dialog.Title className={titleClassName}>1:1 문의</Dialog.Title>
        <Dialog.Description className={descriptionClassName}>
          작성 중에 닫으면 내용을 버릴지 물어봐요.
        </Dialog.Description>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="문의 내용을 입력해 주세요"
          className={textareaClassName}
        />
        <div className="mt-4 flex justify-end">
          <Dialog.Close className={secondaryButtonClassName}>닫기</Dialog.Close>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Dialog.Overlay className={overlayClassName} />

          <Dialog.Content className={contentClassName}>
            <Dialog.Title className={titleClassName}>
              작성 중인 내용을 버릴까요?
            </Dialog.Title>
            <Dialog.Description className={descriptionClassName}>
              지금 닫으면 입력한 문의 내용이 사라져요.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className={secondaryButtonClassName}>
                계속 작성
              </Dialog.Close>
              <button
                type="button"
                onClick={discardAndClose}
                className="cursor-pointer rounded-lg bg-[#e9435a] px-4 py-2.5 text-sm font-bold text-white"
              >
                버리기
              </button>
            </div>
          </Dialog.Content>
        </Dialog>
      </Dialog.Content>
    </Dialog>
  );
}

export function DialogDemo() {
  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl font-bold">Dialog — Compound</h2>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          1. 기본 컨텐츠 · uncontrolled — 조각 조립만으로 완성
        </p>
        <BasicDialogDemo />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          2. Form · controlled — 비동기 저장 후 닫기 (Radix ‘async form
          submission’)
        </p>
        <FormDialogDemo />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          3. Nested · 중첩 2단 — ESC는 최상단 Dialog부터
        </p>
        <NestedDialogDemo />
      </div>
      <div>
        <p className="mb-2 text-sm text-[#8794a3]">
          4. Close confirmation · 닫기 가로채기 + 중첩 (Base UI ‘close
          confirmation’)
        </p>
        <CloseConfirmDialogDemo />
      </div>
    </section>
  );
}
