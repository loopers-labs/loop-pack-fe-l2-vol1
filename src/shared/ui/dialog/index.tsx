import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface DialogContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
  const context = use(DialogContext);

  if (context === null) {
    throw new Error("<Dialog> 안에서만 사용가능 합니다.");
  }

  return context;
}

function useDialogOpen(
  controlledOpen: boolean | undefined,
  onOpenChange?: (open: boolean) => void,
): DialogContextValue {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (nextIsOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextIsOpen);
    onOpenChange?.(nextIsOpen);
  };

  return { isOpen, setOpen };
}

// createPortal 은 children 을 document.body 로 이식하는데, 서버엔 document 가 없다. 그래서
// "지금 클라이언트인가"로 portal 렌더 여부를 가른다.
//
// 왜 렌더 중 `typeof window` 로 안 가르나: 만약 SSR시점에서 dialog에 open값을 true로 주었다면
// DialogPortal에서 if (!isClient) return null; 에서 isClient가 서버는 false, 클라 "첫" 렌더는 true 가 되기 때문에
// mismatch가 발생한다. 그래서 useSyncExternalStore로 "서버+하이드레이션 첫 렌더까지 false, 그 다음 렌더부터 true"로 만들어서 mismatch를 방지한다.
//
// 흔한 대안인 mounted state 2-pass 도 여기선 못 쓴다:
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => { setMounted(true); }, []);   // ← react-hooks/set-state-in-effect 에 걸림
// (effect 안 동기 setState = cascading render이기 때문)
//
// subscribeNothing: 한번 클라이언트면 계속 클라이언트라 이 값은 런타임에 안 바뀐다 → 구독할 외부
// 변화가 없어 no-op 구독자를 넘긴다(useSyncExternalStore 의 첫 인자는 필수라 비워둘 수 없다).
const subscribeNothing = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true, // getSnapshot — 클라 스냅샷
    () => false, // getServerSnapshot — 서버 + 하이드레이션 첫 렌더까지 이 값
  );
}

function DialogPortal({ children }: { children: ReactNode }) {
  const isClient = useIsClient();

  if (!isClient) return null;

  return createPortal(children, document.body);
}

// 소비자가 어떤 엘리먼트를 넘길지 몰라 props 키·값을 미리 못 잡는다 → any 대신 unknown 으로 받고
// 쓰기 전에 isRecord/isFunction 으로 좁힌다. mergeProps/Slot 의 props 타입.
type UnknownProps = Record<string, unknown>;
type EventHandler = (...args: unknown[]) => void;

const isFunction = (value: unknown): value is EventHandler =>
  typeof value === "function";
const isRecord = (value: unknown): value is UnknownProps =>
  typeof value === "object" && value !== null;

// slot(주입) props 를 자식 props 에 병합: on* 핸들러는 합성(자식 먼저 → 주입), className 은 join,
// style 은 객체 병합, 그 외는 자식 우선.
function mergeProps(
  slotProps: UnknownProps,
  childProps: UnknownProps,
): UnknownProps {
  const merged: UnknownProps = { ...slotProps };

  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    const isEventHandler = /^on[A-Z]/.test(key);

    if (isEventHandler && isFunction(slotValue) && isFunction(childValue)) {
      merged[key] = (...args: unknown[]) => {
        childValue(...args);
        slotValue(...args);
      };
    } else if (key === "style") {
      const slotStyle = isRecord(slotValue) ? slotValue : {};
      const childStyle = isRecord(childValue) ? childValue : {};
      merged[key] = { ...slotStyle, ...childStyle };
    } else if (key === "className") {
      merged[key] = [slotValue, childValue].filter(Boolean).join(" ");
    } else {
      merged[key] = childValue;
    }
  }

  return merged;
}

function Slot({
  children,
  ...slotProps
}: { children: ReactNode } & UnknownProps) {
  // isValidElement: children 이 진짜 React 엘리먼트인지 검사. 문자열·숫자·배열·null 이면
  // cloneElement 로 props 를 못 얹으므로 여기서 걸러 낸다.
  if (!isValidElement(children)) {
    throw new Error("asChild 를 쓰면 React 엘리먼트를 자식으로 넘겨야 한다.");
  }

  const childProps = isRecord(children.props) ? children.props : {};

  // cloneElement: 자식 엘리먼트를 복제하면서 병합된 props(slot 주입분 + 자식 원본)를 얹어
  // 새 엘리먼트로 돌려준다. 자식 태그를 그대로 두고 props 만 갈아끼우는 게 asChild 의 핵심.
  return cloneElement(children, mergeProps(slotProps, childProps));
}

interface DialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open, onOpenChange }: DialogProps) {
  const value = useDialogOpen(open, onOpenChange);
  const { isOpen, setOpen } = value;

  const closeOnEscape = useEffectEvent(() => setOpen(false));

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOnEscape();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return <DialogContext value={value}>{children}</DialogContext>;
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & { asChild?: boolean };

function DialogTrigger({ asChild, onClick, ...props }: ButtonProps) {
  const { setOpen } = useDialogContext();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(true);
  };

  const Comp: ElementType = asChild ? Slot : "button";

  return (
    <Comp
      {...(asChild ? {} : { type: "button" })}
      onClick={handleClick}
      {...props}
    />
  );
}

function DialogClose({ asChild, onClick, ...props }: ButtonProps) {
  const { setOpen } = useDialogContext();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  const Comp: ElementType = asChild ? Slot : "button";

  return (
    <Comp
      {...(asChild ? {} : { type: "button" })}
      onClick={handleClick}
      {...props}
    />
  );
}

type DivProps = ComponentPropsWithoutRef<"div"> & { asChild?: boolean };

function DialogOverlay({ asChild, onClick, ...props }: DivProps) {
  const { isOpen, setOpen } = useDialogContext();

  useEffect(() => {
    if (!isOpen) return;

    // globals.css 의 create-next-app 이 깔아주는 기본 보일러플레이트 html `overflow-x: hidden` 탓에
    // 스크롤 컨테이너가 body가 아니라 html(viewport)다 → body 를 잠가도 안 먹는다. 실제 컨테이너인 html 을 잠근다.
    const html = document.documentElement;
    // 스크롤바가 사라지며 넓어지는 폭 = 덜컹 방지용으로 채워야 할 값. 잠그기 전에 측정한다.
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    const previousOverflow = html.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    html.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  const Comp: ElementType = asChild ? Slot : "div";

  return (
    <DialogPortal>
      <Comp onClick={handleClick} {...props} />
    </DialogPortal>
  );
}

function DialogContent({ asChild, ...props }: DivProps) {
  const { isOpen } = useDialogContext();

  if (!isOpen) return null;

  const Comp: ElementType = asChild ? Slot : "div";

  return (
    <DialogPortal>
      <Comp {...props} />
    </DialogPortal>
  );
}

function DialogTitle({
  asChild,
  ...props
}: ComponentPropsWithoutRef<"h2"> & { asChild?: boolean }) {
  const Comp: ElementType = asChild ? Slot : "h2";

  return <Comp {...props} />;
}

function DialogDescription({
  asChild,
  ...props
}: ComponentPropsWithoutRef<"p"> & { asChild?: boolean }) {
  const Comp: ElementType = asChild ? Slot : "p";

  return <Comp {...props} />;
}

Dialog.Trigger = DialogTrigger;
Dialog.Overlay = DialogOverlay;
Dialog.Content = DialogContent;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;

export { Dialog };
