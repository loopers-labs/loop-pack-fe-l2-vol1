import { describe, expect, it } from 'vitest';
import { PROTECTED_PATH_PREFIXES } from './protected-routes';
import { config } from '@/proxy';

// proxy.ts의 matcher(진입 자체를 막는 목록)와 protected-routes.ts의
// PROTECTED_PATH_PREFIXES(401을 만료로 볼지 판단하는 목록)는 같은 경로를
// 가리켜야 한다. matcher는 Next.js가 빌드 타임에 정적으로 읽어야 해서
// 리터럴이라 한쪽에서 다른 쪽을 파생시킬 수 없다(9주차 피드백) — 대신 이
// 테스트로 둘이 갈라지면 바로 실패하게 한다.
describe('proxy.ts matcher와 protected-routes.ts prefix가 같은 경로를 가리키는지', () => {
  it('각 prefix마다 matcher에 정확히 두 항목(prefix, prefix/:path*)이 있다', () => {
    const expected = PROTECTED_PATH_PREFIXES.flatMap((prefix) => [
      prefix,
      `${prefix}/:path*`,
    ]);

    expect(config.matcher).toEqual(expected);
  });
});
