import { trackSessionExpired } from '@/analytics/events';

export function redirectToLogin(): void {
  if (window.location.pathname === '/login') return;

  // track()은 동기다 — sessionStorage에 쓰기가 아래 이동보다 먼저 끝난다.
  trackSessionExpired(window.location.pathname);
  window.location.replace(`/login?next=${encodeURIComponent(window.location.href)}&reason=expired`);
}
