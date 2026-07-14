'use client'

// Dialog (Compound) — 4주차 2단계
//
// compound 조립: Dialog / Dialog.Trigger / Dialog.Overlay / Dialog.Content /
//               Dialog.Title / Dialog.Description / Dialog.Close
// controlled(open prop이 있으면)와 uncontrolled(없으면) 둘 다 지원한다.
// 이중 API 분기는 DialogRoot의 setOpen 한 곳에만 있고, 하위 조각들은
// 자신이 controlled 트리에 있는지 몰라도 된다 — setOpen만 호출한다.
//
// 이번 주 범위 밖: 포커스 트랩/복원/초기 포커스, ARIA 속성.
//
// 파일 구성: 아래 순서대로 읽으면 전체 그림이 잡힌다.
//   1. Types      — 모든 컴포넌트의 props/context 타입을 한 블록에 모아서, 어떤 조각이
//                    어떤 값을 받는지 구현부를 안 봐도 훑을 수 있게 함
//   2. Context    — 이중 API 분기가 실제로 일어나는 곳
//   3. Portal     — SSR-safe하게 body에 렌더하는 공용 헬퍼
//   4. Compound   — Trigger/Overlay/Content/Title/Description/Close
//   5. Export     — Object.assign으로 조각을 Dialog 하나에 묶어서 내보냄

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './Dialog.module.css'

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------

type DialogContextValue = {
  isOpen: boolean
  setOpen: (next: boolean) => void
}

type DialogProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

type DialogPortalProps = { children: ReactNode }
type DialogTriggerProps = ComponentPropsWithoutRef<'button'>
type DialogOverlayProps = ComponentPropsWithoutRef<'div'>
type DialogContentProps = ComponentPropsWithoutRef<'div'>
type DialogTitleProps = ComponentPropsWithoutRef<'h2'>
type DialogDescriptionProps = ComponentPropsWithoutRef<'p'>
type DialogCloseProps = ComponentPropsWithoutRef<'button'>

// ---------------------------------------------------------------------------
// 2. Context — 이중 API(controlled/uncontrolled) 분기가 일어나는 유일한 지점
// ---------------------------------------------------------------------------

const DialogContext = createContext<DialogContextValue | null>(null)

/*
 * useSelect와 달리 Dialog는 상태를 custom hook으로 빼지 않고 Context로 둔다 — Select는
 * "하나의 동작을 여러 마크업이 공유"하는 문제라 훅이 맞고, Dialog는 "여러 조각(Trigger/
 * Overlay/Content/Close)이 같은 상태 일부씩만 구독"하는 문제라 Context가 맞는 도구다.
 * 자세한 비교는 src/hooks/README.md 참고.
 */
// Dialog 밖에서 Dialog.Trigger 등을 쓰는 실수를 조립 순서 문제로 남기지 않고 바로 에러로 드러낸다.
const useDialogContext = (component: string): DialogContextValue => {
  const context = useContext(DialogContext)
  if (context === null) {
    throw new Error(`Dialog.${component}은 <Dialog> 내부에서만 사용할 수 있습니다.`)
  }
  return context
}

const DialogRoot = ({ open, defaultOpen = false, onOpenChange, children }: DialogProps) => {
  // 판별 기준은 이거 하나 — open을 넘기면 controlled, 안 넘기면(undefined) uncontrolled.
  const isControlled = open !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = isControlled ? open : uncontrolledOpen

  // 하위 조각들(Trigger/Overlay/Close...)은 이 함수만 호출한다. "state를 누가 갖는가"는
  // 여기 안에서만 분기하므로, 하위 조각은 controlled 여부를 몰라도 된다.
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return <DialogContext.Provider value={{ isOpen, setOpen }}>{children}</DialogContext.Provider>
}

// ---------------------------------------------------------------------------
// 3. Portal — Overlay/Content가 공용으로 쓰는 SSR-safe 포탈 헬퍼
// ---------------------------------------------------------------------------

/*
 * document가 없는 서버 렌더와 hydration 중에는 포탈을 만들지 않고, 마운트가 끝난 뒤에만
 * document.body로 렌더한다. mounted는 외부 store의 값이 아니라 React 컴포넌트 생명주기에서
 * 파생되는 로컬 상태이므로 useState와 useEffect로 직접 표현한다.
 */
const useIsMounted = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // 포탈을 hydration 이후에만 만드는 의도적인 1회 추가 렌더다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  return isMounted
}

const DialogPortal = ({ children }: DialogPortalProps) => {
  const isMounted = useIsMounted()
  if (!isMounted) return null
  return createPortal(children, document.body)
}

// ---------------------------------------------------------------------------
// 4. Compound — Trigger / Overlay / Content / Title / Description / Close
// ---------------------------------------------------------------------------

const DialogTrigger = ({ onClick, ...props }: DialogTriggerProps) => {
  const { setOpen } = useDialogContext('Trigger')
  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event)
        setOpen(true)
      }}
      {...props}
    />
  )
}

/*
 * Overlay와 Content는 각자 독립적으로 body에 포탈되는 형제다 — 부모/자식 관계가 아니므로
 * Content를 클릭해도 그 이벤트가 Overlay의 onClick으로 버블링될 길이 아예 없다.
 * stopPropagation이나 target===currentTarget 방어 코드 없이 "오버레이만 닫힘"이 보장된다.
 */
const DialogOverlay = ({ onClick, ...props }: DialogOverlayProps) => {
  const { isOpen, setOpen } = useDialogContext('Overlay')
  if (!isOpen) return null
  return (
    <DialogPortal>
      <div
        className={styles.overlay}
        onClick={(event) => {
          onClick?.(event)
          setOpen(false)
        }}
        {...props}
      />
    </DialogPortal>
  )
}

const DialogContent = ({ children, ...props }: DialogContentProps) => {
  const { isOpen, setOpen } = useDialogContext('Content')

  /*
   * setOpen은 DialogRoot가 렌더될 때마다 새 함수로 만들어진다(controlled 소비자가 onOpenChange를
   * 인라인으로 넘기면 특히 자주 바뀐다). 아래 keydown effect의 deps에 setOpen을 직접 넣으면
   * 다이얼로그가 열려 있는 동안에도 부모가 리렌더될 때마다 리스너를 떼었다 다시 붙이게 된다 —
   * ref에 최신 함수만 담아두고 keydown effect는 isOpen에만 반응하게 해서 이 churn을 없앤다.
   * ref 갱신은 렌더 중이 아니라 커밋 이후(deps 없는 effect)에 해야 한다 — 렌더 중 ref.current를
   * 바꾸는 건 React 19에서 금지된 패턴이다(react-hooks/refs).
   */
  const setOpenRef = useRef(setOpen)
  useEffect(() => {
    setOpenRef.current = setOpen
  })

  /*
   * `if (!isOpen) return null`은 이 컴포넌트의 렌더 출력만 비울 뿐 훅 자체는 매번 그대로
   * 실행된다 — 즉 이 effect를 isOpen과 무관하게 두면 닫혀 있을 때도 Esc 리스너가 붙고
   * 스크롤이 잠긴다. 그래서 effect 안에서 직접 isOpen을 확인해 열려 있을 때만 동작시킨다.
   */
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenRef.current(false)
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) return null
  return (
    <DialogPortal>
      <div className={styles.content} {...props}>
        {children}
      </div>
    </DialogPortal>
  )
}

const DialogTitle = (props: DialogTitleProps) => {
  useDialogContext('Title')
  return <h2 className={styles.title} {...props} />
}

const DialogDescription = (props: DialogDescriptionProps) => {
  useDialogContext('Description')
  return <p className={styles.description} {...props} />
}

const DialogClose = ({ children, onClick, ...props }: DialogCloseProps) => {
  const { setOpen } = useDialogContext('Close')
  return (
    <button
      type="button"
      className={styles.close}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    >
      {children ?? '×'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// 5. Export — Dialog 자체가 컴포넌트이면서 조각들의 네임스페이스가 되도록 Object.assign으로 합친다.
// const로 선언한 함수엔 나중에 프로퍼티를 못 붙이는데(TS가 막음), Object.assign은 T & U 반환
// 오버로드가 있어 as 캐스팅 없이 "함수 + 붙인 프로퍼티들" 타입이 그대로 안전하게 합쳐진다.
// ---------------------------------------------------------------------------

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
})
