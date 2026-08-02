import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import type { SelectOptionBase } from '../types';
import { findEnabledIndex, getOptionDomId, isOptionSelected } from '../utils';

type UseSelectParams<T extends SelectOptionBase> = {
  options: T[];
  /** controlled 선택값(옵션 객체 전체) */
  value?: T | null;
  /** uncontrolled 초기 선택값 */
  defaultValue?: T | null;
  /** 선택 시 호출, 옵션 객체 전체를 그대로 돌려준다 */
  onChange?: (option: T) => void;
  /** 초기 열림 상태 (기본값 false) */
  defaultOpen?: boolean;
};

type SelectItem<T extends SelectOptionBase> = {
  option: T;
  index: number;
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};

const OPEN_KEYS = ['Enter', ' ', 'ArrowDown', 'ArrowUp'];

/* AI-generated */
/**
 * @description select 데이터를 제어하기 위한 hook
 * @param param0
 * @param param0.options select 옵션 목록
 * @param param0.value controlled 선택값
 * @param param0.defaultValue uncontrolled 초기 선택값
 * @param param0.onChange 선택 시 호출되는 콜백
 */
export function useSelect<T extends SelectOptionBase>({
  options,
  value,
  defaultValue,
  onChange,
  defaultOpen,
}: UseSelectParams<T>) {
  //value 유무로만 controlled/unControlled 판별 (defaultValue는 unControlled일 때 초기값으로만 쓰임)
  const isControlled = value !== undefined;
  //unControlled일 때 SelectBox 선택된 option 저장
  const [internalSelected, setInternalSelected] = useState<T | null>(defaultValue ?? null);
  //controlled = 외부 value / unControlled = 내부 관리 값
  const selected = isControlled ? value : internalSelected;

  //selectBox가 열렸는지
  const [open, setOpen] = useState(defaultOpen ?? false);
  //지금 키보드 또는 마우스로 가리키고 있는 옵션 인덱스(선택된게 아님)
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  //포커스를 위해 정의
  const triggerRef = useRef<HTMLButtonElement>(null);
  //키보드 이동을 위해 정의
  const listboxRef = useRef<HTMLUListElement>(null);

  /**
   * @description SelectBox 옵션을 선택했을 때
   * @param option 선택할 옵션 객체
   */
  const selectOption = (option: T) => {
    if (!isControlled) {
      //unControlled인 경우, 디자인 요소 자체내에서 관리해야 하므로 setInternalSelected로 set한다.
      setInternalSelected(option);
    }
    onChange?.(option);
  };

  /**
   * @description SelectBox가 열렸을 때
   */
  const openListbox = () => {
    const selectedIndex = options.findIndex((option) => isOptionSelected(option, selected));
    const startIndex = selectedIndex >= 0 ? selectedIndex : findEnabledIndex(-1, 1, options);
    setHighlightedIndex(startIndex);
    setOpen(true);
  };

  /**
   * @description SelectBox를 닫았을 때
   */
  const closeListbox = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    //포커스가 listbox 자신에 있어야 keydown이 거기서 직접 발생해 onKeyDown이 호출된다.
    listboxRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    /**
     * @description 마우스 클릭 다운 이벤트 발생시, 클릭 위치에 따라 SelectBox를 닫거나 유지한다.
     * @param event 마우스 이벤트
     */
    const handlePointerDown = (event: MouseEvent) => {
      //클릭한 요소
      const target = event.target as Node;
      //클릭 위치가 SelectBox 내부면: return
      if (triggerRef.current?.contains(target) || listboxRef.current?.contains(target)) return;
      //클릭 위치가 SelectBox 외부면: SelectBox 닫기
      closeListbox();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, closeListbox]);

  /**
   * @description SelectBox 자체를 마우스로 클릭 했을 때
   */
  const handleTriggerClick = () => {
    if (open) {
      //열려 있으면 닫고
      closeListbox();
    } else {
      //닫혀있으면 열고
      openListbox();
    }
  };

  /**
   * @description SelectBox 자체를 키보드 입력 방식으로 열었을 때
   * @param event 키보드 이벤트
   */
  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    //SelectBox를 여는 키보드 입력이 아니면 return
    if (!OPEN_KEYS.includes(event.key)) return;
    //이벤트 초기화
    event.preventDefault();
    if (!open) {
      //SelectBox가 닫혀있는 상태라면 SelectBox를 연다.
      openListbox();
    }
  };

  /**
   * @description SelectBox가 열린 상태에서 키보드 조작시
   * @param event 키보드 이벤트
   */
  const handleListboxKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        //option 요소 아래로
        event.preventDefault();
        setHighlightedIndex((current) => findEnabledIndex(current, 1, options));
        break;
      case 'ArrowUp':
        //option 요소 위로
        event.preventDefault();
        setHighlightedIndex((current) => findEnabledIndex(current, -1, options));
        break;
      case 'Enter':
      case ' ': {
        // option 선택
        event.preventDefault();
        const option = options[highlightedIndex];
        if (option && !option.disabled) {
          selectOption(option);
          closeListbox();
        }
        break;
      }
      case 'Escape':
        // SelectBox를 닫는다.
        event.preventDefault();
        closeListbox();
        break;
      default:
        break;
    }
  };

  //인자로 받은 option 데이터 가공 (useSelect는 훅이라 "props"가 아니라 "인자")
  const items: SelectItem<T>[] = options.map((option, index) => ({
    option,
    index,
    selected: isOptionSelected(option, selected),
    highlighted: index === highlightedIndex,
    disabled: !!option.disabled,
  }));

  //SelectBox props
  const getTriggerProps = () => ({
    ref: triggerRef,
    onClick: handleTriggerClick, //마우스 동작
    onKeyDown: handleTriggerKeyDown, //키보드 동작
    'aria-haspopup': 'listbox' as const, //SelectBox 클릭시 팝업이 뜬다 안내
    'aria-expanded': open, //SelectBox의 optionList 팝업이 떳다
  });

  //SelectBox - ListBox props
  const getListboxProps = () => ({
    ref: listboxRef,
    role: 'listbox' as const,
    tabIndex: -1 as const,
    onKeyDown: handleListboxKeyDown, //키보드 조작시
    //가상으로 활성화 된 옵션이 어디에 있는지 스크린리더에 알려주는 용도
    'aria-activedescendant':
      highlightedIndex >= 0 ? getOptionDomId(options[highlightedIndex].id) : undefined,
  });

  //SelectBox - Options props
  const getOptionProps = (index: number) => {
    const option = options[index];
    const disabled = !!option.disabled;
    return {
      id: getOptionDomId(option.id),
      role: 'option' as const,
      'aria-selected': isOptionSelected(option, selected), //어떤 option이 선택되었다.
      'aria-disabled': disabled, //어떤 option이 비활성화 되었다.
      onClick: () => {
        //마우스로 클릭되었을 때
        if (disabled) return;
        selectOption(option);
        closeListbox();
      },
      onMouseEnter: () => {
        //마우스로 옵션에 올라왔을 때(hover) 하이라이트 이동
        if (disabled) return;
        setHighlightedIndex(index);
      },
    };
  };

  return {
    open,
    selected,
    items,
    getTriggerProps,
    getListboxProps,
    getOptionProps,
  };
}
