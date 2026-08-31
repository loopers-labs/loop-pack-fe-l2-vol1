import { HttpError } from '@/shared/api/HttpError';
import { redirectToLogin } from './authNavigation';

export function handleSessionExpiry(
  error: Error,
  meta: Readonly<Record<string, unknown>> | undefined,
): void {
  if (
    meta?.requiresAuthentication === true &&
    error instanceof HttpError &&
    error.status === 401
  ) {
    redirectToLogin();
  }
}
