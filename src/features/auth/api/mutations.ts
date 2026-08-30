import { mutationOptions } from '@tanstack/react-query';

import { login, logout } from './auth';

export const loginMutationOptions = mutationOptions({
  mutationFn: login,
  // 로그인 401은 세션 만료가 아니라 폼에서 보여줄 자격 증명 오류다.
  throwOnError: false,
});

export const logoutMutationOptions = mutationOptions({ mutationFn: logout });
