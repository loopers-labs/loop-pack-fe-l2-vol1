import type { HomeResponse } from '@/_pages/home/api/home'

// 7주차 starter가 제공한 Hero다. 배너 계약을 소유한 홈 슬라이스 안에 둔다.
// starter 원본 경로(src/examples/week-07-performance)를 쓰지 않는 이유는 examples가
// FSD 레이어가 아니라서, 페이지 슬라이스가 그쪽을 참조하면 의존 방향을 설명할 수 없기 때문이다.
//
// Before 상태를 그대로 남긴다. 3840x2160 원본을 next/image 없이 그대로 내려서
// 0단계 측정이 "무엇이 느린가"를 실제로 재현하게 한다. 1단계에서 측정 결과를 보고 바꾼다.

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>

// 홈의 유일한 h1이다. 지금은 배너 응답이 와야 제목이 생긴다.
// 이 결합이 0단계에서 관찰할 문제다 — 느린 데이터가 페이지 제목까지 늦춘다.
export default function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className="week07-hero">
      {/* eslint-disable-next-line @next/next/no-img-element -- Before 측정용으로 최적화하지 않은 LCP 이미지를 의도적으로 둔다. 1단계에서 다룬다. */}
      <img
        className="week07-hero-image"
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
      />
      <div className="week07-hero-copy">
        <p className="week07-hero-eyebrow">EDITOR&apos;S PICK</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}
