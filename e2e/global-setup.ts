import { rmSync } from 'node:fs';
import path from 'node:path';

/**
 * `.auth/` 를 실행당 1회만 비운다.
 *
 * worker fixture(`e2e/fixtures/worker-auth.ts`) 안에서 지우면 워커 여러 개가 동시에 뜰 때
 * 서로 방금 만든 storageState 파일을 지우는 경쟁이 생긴다. globalSetup 은 모든 워커가
 * 뜨기 전에 정확히 한 번만 실행되므로 그 경쟁이 없다.
 */
export default function globalSetup(): void {
  rmSync(path.join(__dirname, '..', '.auth'), { recursive: true, force: true });
}
