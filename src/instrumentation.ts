export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateServerEnv } = await import('./env/validate');

    try {
      validateServerEnv();
    } catch (error) {
      // Next 16.2의 start는 register 예외를 로그로 남기고 프로세스를 유지한다.
      console.error(
        error instanceof Error ? error.message : '서버 env 검증 실패',
      );
      process.exit(1);
    }
  }
}
