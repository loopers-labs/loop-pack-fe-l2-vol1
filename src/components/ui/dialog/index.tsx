'use client'

// Dialog (Compound) — Context로 조립 + controlled/uncontrolled 이중 API.
//
// 설계 근거:
// - 조각(Trigger·Overlay·Content·…)은 Context에서 open/setOpen을 읽는다.
//   조립 순서·생김새는 사용처가 정하고, 열림 상태의 진실은 Dialog 하나가 쥔다.
// - 이중 API: open prop "유무"로 판별한다. controlled면 내부 state를 아예 만들지
//   않은 것처럼 무시하고, 상태 변경 의도는 항상 onOpenChange로 통지한다.
// - Esc·배경 스크롤 잠금은 화면에 실제로 뜨는 Content가 소유한다.
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

interface DialogProps {
  /** 있으면 controlled — 열림 상태의 진실이 부모에게 있다 */
  open?: boolean
  /** uncontrolled 초기값 */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

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
        setOpen(true)
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
  const mounted = useMounted()

  if (!open || !mounted) return null

  return createPortal(
    <div
      {...rest}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 20, 28, 0.5)',
        ...style,
      }}
    />,
    document.body,
  )
}

function DialogContent({
  style,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'>) {
  const { open, setOpen } = useDialogContext('Content')
  const mounted = useMounted()

  // Esc로 닫기 — 열려 있는 동안만 문서 레벨에서 듣는다.
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  // 배경 스크롤 잠금 — 이전 값을 기억했다가 닫힐 때 그대로 복원한다.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
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
    </div>,
    document.body,
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
        setOpen(false)
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
