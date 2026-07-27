/**
 * Native Popover API와 CSS Anchor Positioning 지원 여부를 한곳에서 판정한다.
 *
 * SelectContent는 이 모듈이 노출하는 `subscribe`/`getSnapshot`만 사용하고,
 * 지원 여부를 확인하는 문자열을 컴포넌트 본문에 직접 나열하지 않는다.
 * 브라우저가 일부 기능만 부분 지원하는 경우에도 판정이 한 곳에 모여 있어
 * "전체를 대체 경로로 떨어뜨릴지, 부분 허용할지"를 여기서 명확히 결정한다.
 *
 * 현재 정책: Native Popover와 Anchor Positioning 세 가지 기능이 모두 있어야
 * native popover 경로를 사용한다. 하나라도 빠지면 inline fallback으로 동작한다.
 */

const ANCHOR_POSITIONING_FEATURES = [
  'position-area: block-end',
  'width: anchor-size(width)',
  'position-try-fallbacks: flip-block',
] as const

export class PopoverCapability {
  private constructor() {}

  static subscribe() {
    return () => undefined
  }

  static getSnapshot() {
    return (
      PopoverCapability.hasNativePopoverApi() &&
      PopoverCapability.hasAnchorPositioning()
    )
  }

  static getServerSnapshot() {
    return false
  }

  private static hasNativePopoverApi() {
    return (
      typeof HTMLElement !== 'undefined' &&
      typeof HTMLButtonElement !== 'undefined' &&
      'popover' in HTMLElement.prototype &&
      typeof HTMLElement.prototype.showPopover === 'function' &&
      typeof HTMLElement.prototype.hidePopover === 'function' &&
      'popoverTargetElement' in HTMLButtonElement.prototype
    )
  }

  private static hasAnchorPositioning() {
    return (
      typeof CSS !== 'undefined' &&
      ANCHOR_POSITIONING_FEATURES.every((feature) => CSS.supports(feature))
    )
  }
}
