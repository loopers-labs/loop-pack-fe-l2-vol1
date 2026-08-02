'use client'

// Dialog (Compound) — Context로 조립 + controlled/uncontrolled 이중 API.
//
// 설계 근거:
// - 조각(Trigger·Overlay·Content·…)은 Context에서 open/setOpen을 읽는다.
//   조립 순서·생김새는 사용처가 정하고, 열림 상태의 진실은 Dialog 하나가 쥔다.
// - 이중 API: open prop "유무"로 판별한다. controlled면 내부 state를 아예 만들지
//   않은 것처럼 무시하고, 상태 변경 의도는 항상 onOpenChange로 통지한다.
// - Esc·배경 스크롤 잠금은 화면에 실제로 뜨는 Content가 소유한다.
//   (Overlay 단독 조립은 이 둘을 갖지 않는다 — Radix와 같은 배치.)
// - 포커스 트랩·복원·ARIA는 이번 주 범위 밖(과제 명세).
//
// export는 Dialog 하나 — 조각은 프로퍼티로 부착한다(compound의 단일 진입점).

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

interface DialogProps {
  /**
   * 있으면 controlled — 열림 상태의 진실이 부모에게 있다.
   * 생애 중 controlled↔uncontrolled를 오가면 안 된다: undefined로 바뀌는 순간
   * 낡은 내부 상태로 조용히 스냅된다 (input과 달리 React 경고도 없다).
   */
  open?: boolean
  /** uncontrolled 초기값 */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(pieceName: string): DialogContextValue {
  const context = useContext(DialogContext)
  if (context === null) {
    throw new Error(`<Dialog.${pieceName}>은 <Dialog> 안에서만 쓸 수 있어요.`)
  }
  return context
}

// SSR엔 document가 없다 — 마운트 후에만 포털을 렌더한다.
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

// 다이얼로그가 겹쳐 열릴 수 있어 잠금은 참조 카운트로 관리한다.
// 인스턴스별 저장·복원은 닫는 순서에 따라 body가 hidden에 고착되거나
// 열린 다이얼로그 뒤로 스크롤이 풀린다.
let scrollLockCount = 0
let bodyOverflowBeforeLock = ''

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1
}

function unlockBodyScroll() {
  scrollLockCount -= 1
  if (scrollLockCount === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock
  }
}

// Esc는 최상단 다이얼로그만 닫아야 한다 — 열린 순서대로 쌓고 맨 위만 반응한다.
const escapeCloseStack: Array<() => void> = []

function DialogRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = (next: boolean) => {
    // controlled면 상태를 직접 바꾸지 않는다 — 변경 "의도"만 부모에게 통지한다.
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

// open+mounted 게이트와 포털 타깃을 한 곳에 — Overlay·Content가 같은 블록을
// 반복하면 SSR 전략·타깃 변경 시 두 곳이 어긋난다.
function DialogPortal({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const mounted = useMounted()
  if (!open || !mounted) return null
  return createPortal(children, document.body)
}

function DialogTrigger({
  onClick,
  children,
  ...rest
}: ComponentPropsWithoutRef<'button'>) {
  const { setOpen } = useDialogContext('Trigger')
  return (
    <button
      type="button"
      {...rest}
      onClick={(event) => {
        onClick?.(event)
        // 사용처가 preventDefault로 열기를 거부할 수 있어야 한다 (합성 핸들러 계약).
        if (!event.defaultPrevented) setOpen(true)
      }}
    >
      {children}
    </button>
  )
}

function DialogOverlay({
  onClick,
  style,
  ...rest
}: ComponentPropsWithoutRef<'div'>) {
  const { open, setOpen } = useDialogContext('Overlay')
  return (
    <DialogPortal open={open}>
      <div
        {...rest}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) setOpen(false)
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 20, 28, 0.5)',
          ...style,
        }}
      />
    </DialogPortal>
  )
}

function DialogContent({
  style,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'>) {
  const { open, setOpen } = useDialogContext('Content')

  // Esc로 닫기 — 열려 있는 동안만 문서 레벨에서 듣고, 최상단일 때만 반응한다.
  useEffect(() => {
    if (!open) return
    const closeSelf = () => setOpen(false)
    escapeCloseStack.push(closeSelf)
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // 한글 IME 조합 취소 Esc가 다이얼로그까지 닫으면 안 된다.
      if (event.isComposing) return
      if (escapeCloseStack[escapeCloseStack.length - 1] === closeSelf) {
        closeSelf()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      const index = escapeCloseStack.indexOf(closeSelf)
      if (index !== -1) escapeCloseStack.splice(index, 1)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen])

  // 배경 스크롤 잠금 — 겹침을 견디도록 참조 카운트로 잠그고 푼다.
  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [open])

  return (
    <DialogPortal open={open}>
      <div
        {...rest}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          minWidth: 320,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          ...style,
        }}
      >
        {children}
      </div>
    </DialogPortal>
  )
}

function DialogTitle({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) {
  return <h2 {...rest}>{children}</h2>
}

function DialogDescription({
  children,
  ...rest
}: ComponentPropsWithoutRef<'p'>) {
  return <p {...rest}>{children}</p>
}

function DialogClose({
  onClick,
  children,
  ...rest
}: ComponentPropsWithoutRef<'button'>) {
  const { setOpen } = useDialogContext('Close')
  return (
    <button
      type="button"
      {...rest}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
})
