import Image from 'next/image'
import type { HomeResponse } from '@/_pages/home/api/home'

// 7주차 starter가 제공한 Hero다. 배너 계약을 소유한 홈 슬라이스 안에 둔다.
// starter 원본 경로(src/examples/week-07-performance)를 쓰지 않는 이유는 examples가
// FSD 레이어가 아니라서, 페이지 슬라이스가 그쪽을 참조하면 의존 방향을 설명할 수 없기 때문이다.
//
// 0단계에서 3840x2160 원본 7,545,239 bytes가 그대로 내려가는 것을 확인했다.
// 표시 폭은 아래 sizes가 말하는 만큼인데 원본은 그보다 훨씬 크다.
// optimizer를 거치게 해서 후보 폭과 포맷을 표시 크기에 맞춘다.
//
// 이 변경은 전송 크기 하나만 건드린다. 이미지가 언제 발견되는가는 그대로 둔다.
// HomePage가 응답 전에는 이 컴포넌트를 렌더링하지 않아서, 여기서 preload를 붙여도
// 초기 HTML에 실리지 않기 때문이다. 발견 시점은 렌더링 경계를 옮기는 별도 변경으로 다룬다.

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>

// 홈의 유일한 h1이다. 지금은 배너 응답이 와야 제목이 생긴다.
// 이 결합이 0단계에서 관찰할 문제다 — 느린 데이터가 페이지 제목까지 늦춘다.
export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className="week07-hero">
      {/* width와 height는 원본의 고유 비율이다. 표시 크기가 아니라 종횡비를 알려
          레이아웃이 밀리지 않게 한다. 실제 표시 폭은 sizes가 정한다.
          sizes는 레이아웃 컨테이너 .week05-page의 폭을 구간별로 옮긴 값이다.
          760px 이하에서 여백이 24px로 줄어드는 구간이 따로 있어 세 구간으로 적는다.
          여기서 실제보다 좁게 신고하면 브라우저가 더 작은 후보를 골라 화질이 떨어진다.
          1440px에 좌우 여백 48px을 더한 1488px이 컨테이너가 최대 폭에 닿는 지점이다. */}
      <Image
        className="week07-hero-image"
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
        sizes="(max-width: 760px) calc(100vw - 24px), (min-width: 1488px) 1440px, calc(100vw - 48px)"
        // next/image의 기본값은 lazy다. 바꾸기 전 raw img는 loading 속성이 없어 eager였다.
        // 그대로 두면 이 변경이 전송 크기와 로드 시점을 함께 건드리게 된다.
        // 전송 크기 하나만 비교하려고 이전 동작을 복원한다.
        // 뷰포트 최상단의 LCP 후보라 lazy로 미룰 이유도 없다.
        loading="eager"
      />
      <div className="week07-hero-copy">
        <p className="week07-hero-eyebrow">EDITOR&apos;S PICK</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
