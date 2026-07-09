// document 스크롤은 전역 단일 자원 잠금 관리 모듈
let lockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';

export function lockScroll() {
  lockCount += 1;

  if (lockCount > 1) {
    return;
  }

  originalHtmlOverflow = document.documentElement.style.overflow;
  originalBodyOverflow = document.body.style.overflow;

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
  }
}
