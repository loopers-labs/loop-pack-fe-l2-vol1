import Image from 'next/image'

import type { HomeResponse } from '@/entities/product/model/types'

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section
      className="relative [aspect-ratio:16/9] w-full overflow-hidden [color:#211b17] [background:#d8cebf] [@media(max-width:640px)]:[aspect-ratio:4/5]"
      aria-labelledby="week07-hero-title"
    >
      <Image
        className="block size-full object-cover [@media(max-width:640px)]:[object-position:56%_center]"
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        sizes="(max-width: 640px) calc(222.2222vw - 106.6667px), (max-width: 1152px) calc(100vw - 48px), 1104px"
      />
      <div className="absolute [inset:auto_auto_clamp(20px,5vw,64px)_clamp(20px,5vw,64px)] w-[min(440px,calc(100%_-_40px))] p-[clamp(18px,3vw,32px)] [backdrop-filter:blur(8px)] [background:rgb(255_253_248_/_88%)]">
        <p className="[font-size:13px] leading-[1.6] [font-weight:700] tracking-[0.12em]">
          이번 주의 발견
        </p>
        <h2
          id="week07-hero-title"
          className="[margin:6px_0_10px] [font-size:clamp(28px,4vw,52px)] leading-[1.08] tracking-[-0.04em]"
        >
          {title}
        </h2>
        <p className="leading-[1.6]">{description}</p>
      </div>
    </section>
  )
}
