import Image from 'next/image'

// 7주차 starter가 제공한 Hero다. 배너 계약을 소유한 홈 슬라이스 안에 둔다.
// starter 원본 경로(src/examples/week-07-performance)를 쓰지 않는 이유는 examples가
// FSD 레이어가 아니라서, 페이지 슬라이스가 그쪽을 참조하면 의존 방향을 설명할 수 없기 때문이다.
//
// 문구를 배너 응답 타입이 아니라 평범한 문자열로 받는다. 이 문구의 주인은 홈 셸이고,
// 셸은 느린 응답을 기다리지 않는다. 응답에 묶어두면 제목이 다시 초기 HTML에서 빠진다.

interface HeroSectionProps {
  title: string
  description: string
}

// 홈의 유일한 h1이다.
export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className="week07-hero">
      {/* width와 height는 원본의 고유 비율이다. 표시 크기가 아니라 종횡비를 알려
          레이아웃이 밀리지 않게 한다. 실제 표시 폭은 sizes가 정한다.
          sizes는 박스 폭이 아니라 object-fit: cover가 실제로 그리는 이미지 폭이다.
          박스보다 좁게 신고하면 브라우저가 작은 후보를 골라 화질이 떨어진다.

          760px 이하는 박스가 세로형(aspect-ratio 4/5)이라 높이가 크기를 정한다.
          16:9 원본이 세로 박스를 덮으려면 좌우로 넘쳐 잘리므로, 그려지는 폭은
          박스 폭 W가 아니라 W x 5/4 x 16/9 = W x 20/9다. W = 100vw - 24px를 넣으면
          222.222vw - 53.333px가 된다.

          그 위 구간은 박스가 가로형(16/8)이라 폭이 그대로 크기를 정한다. 여백은 48px이고,
          1440px에 그 여백을 더한 1488px이 컨테이너가 최대 폭에 닿는 지점이다. */}
      <Image
        className="week07-hero-image"
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
        sizes="(max-width: 760px) calc(222.222vw - 53.333px), (min-width: 1488px) 1440px, calc(100vw - 48px)"
        // 정적으로 알고 있는 LCP 후보를 초기 HTML에서 발견할 수 있게 한다.
        // Hero가 서버 셸에서 렌더링되어야 이 힌트가 첫 응답에 포함된다.
        preload
      />
      <div className="week07-hero-copy">
        <p className="week07-hero-eyebrow">EDITOR&apos;S PICK</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
