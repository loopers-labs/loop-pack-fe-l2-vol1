import { installMockServer } from './msw/lifecycle'

// DOM이 필요 없는 테스트의 setup이다. 브라우저 흉내는 하나도 세우지 않는다.
// 네트워크만 가로챈다. 서버 코드도 실제로 fetch를 부르기 때문이다.
installMockServer()
