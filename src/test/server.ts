import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/**
 * MSW 서버.
 *
 * 앱 코드의 fetch 를 바꿔치기하지 않는다. 요청은 실제로 나가고 여기서 가로챈다.
 * 그래서 apiClient 의 URL 조립·에러 변환(HttpError/NetworkError)까지 테스트가 지난다.
 */
export const server = setupServer(...handlers);
