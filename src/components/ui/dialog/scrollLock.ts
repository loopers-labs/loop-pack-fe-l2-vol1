// document 스크롤은 전역 단일 자원 잠금 관리 모듈
let lockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

export function lockScroll() {
  lockCount += 1;

  if (lockCount > 1) {
    return;
  }

  // 잠그기 전에 스크롤바 폭을 재서 body padding으로 그 자리를 유지한다
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  originalHtmlOverflow = document.documentElement.style.overflow;
  originalBodyOverflow = document.body.style.overflow;
  originalBodyPaddingRight = document.body.style.paddingRight;

  if (scrollbarWidth > 0) {
    const bodyPaddingRight =
      parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    document.body.style.paddingRight = `${bodyPaddingRight + scrollbarWidth}px`;
  }

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (lockCount === 0) {
    return;
  }

  lockCount -= 1;

  if (lockCount === 0) {
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
  }
}
