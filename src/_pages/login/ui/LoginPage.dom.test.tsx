import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { LoginPage } from './LoginPage';

/**
 * 로그인 화면 (통합)
 *
 * 네트워크는 MSW 가 가로챈다. 로그인 API 는 기본 핸들러에 없으므로 각 테스트가 직접 세운다.
 *
 * 여기서 보는 것은 하나뿐이다 — **화면에 무엇이 보이는가.**
 *
 * 로그인 성공 경로가 여기 없다. 성공했을 때 사용자가 겪는 것은 이동과 헤더 갱신인데 둘 다
 * router 를 거치고, 요청 body 의 형태는 사용자가 아니라 서버와의 약속이다. 그 약속이 깨지면
 * 로그인이 실패하고, 그것은 4단계 E2E 가 실제 브라우저에서 로그인해 보며 확인한다.
 *
 * 이동은 보지 않는다. 목적지 계산(`returnTo` 복원, 위험한 값 거부), 헤더 갱신, 실패 시 머무름은
 * 전부 router 를 거치는데, jsdom 에서 router 는 아무 일도 하지 않는 스텁이라 "무엇을 호출했는가"
 * 까지만 알 수 있고 "사용자가 어디에 있게 되는가"는 알 수 없다. 그 절반짜리 단언은 브라우저가
 * 실제로 이동했는지, origin 을 벗어나지 않았는지를 말해주지 않는다 — 4단계 E2E 가 URL 로 확인한다.
 *
 * 단언은 waitFor 로 감싸지 않는다. userEvent 의 click 이 act 로 대기 중인 마이크로태스크까지
 * 흘려보내므로, 클릭이 반환된 시점에 응답과 후처리가 이미 끝나 있다(10회 돌려 확인했다).
 * 성립 조건은 응답이 즉시라는 것이라, delay 를 주는 케이스에만 대기를 붙인다.
 */
const loginRejects = () =>
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ message: '이메일 또는 비밀번호를 확인해주세요.' }, { status: 401 }),
    ),
  );

const renderLoginPage = (props: { reason?: string; returnTo?: string } = {}) =>
  renderWithProviders(<LoginPage {...props} />);

async function submitCredentials(email = 'looper1@loopers.dev', password = 'looper1234') {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('이메일'), email);
  await user.type(screen.getByLabelText('비밀번호'), password);
  await user.click(screen.getByRole('button', { name: '로그인' }));
}

describe('로그인 화면', () => {
  describe('여기로 오게 된 이유를 알려준다', () => {
    it('보호 경로에 미로그인으로 들어와서 왔다면 로그인이 필요하다고 안내한다', () => {
      renderLoginPage({ reason: 'required' });

      expect(screen.getByRole('status')).toHaveTextContent('로그인이 필요한 페이지입니다.');
    });

    it('세션이 만료돼서 왔다면 만료됐다고 안내한다', () => {
      renderLoginPage({ reason: 'expired' });

      expect(screen.getByRole('status')).toHaveTextContent('세션이 만료되었습니다.');
    });

    // 직접 /login 으로 들어온 사람에게 "만료됐다" 같은 사유를 지어내지 않는다
    it('그냥 로그인하러 왔다면 사유를 만들어 보여주지 않는다', () => {
      renderLoginPage();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('제출하면', () => {
    // 두 번 누르면 로그인 요청이 두 번 나간다. 이 케이스만 응답이 늦으므로 여기서만 대기를 붙인다.
    it('응답을 기다리는 동안에는 다시 제출할 수 없다', async () => {
      server.use(http.post('/api/auth/login', () => delay('infinite')));
      renderLoginPage();

      await submitCredentials();

      expect(await screen.findByRole('button', { name: '로그인 중…' })).toBeDisabled();
    });
  });

  describe('자격 증명이 틀리면', () => {
    it('서버가 준 사유를 그대로 보여준다', async () => {
      loginRejects();
      renderLoginPage();

      await submitCredentials('wrong@loopers.dev', 'wrongpassword');

      expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호를 확인해주세요.');
    });
  });
});
