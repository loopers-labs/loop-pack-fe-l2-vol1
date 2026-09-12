export function getAppOrigin(): string {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const origin = process.env.APP_ORIGIN;
  if (!origin) {
    throw new Error('APP_ORIGIN이 설정되지 않았습니다.');
  }

  return origin;
}
