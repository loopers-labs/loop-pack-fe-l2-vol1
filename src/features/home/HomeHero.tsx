import type { HomeResponse } from "./api/homeApi";

type HomeHeroProps = {
  banner: HomeResponse["banner"];
};

export function HomeHero({ banner }: HomeHeroProps) {
  return (
    <section
      className="flex min-h-[260px] flex-col justify-end gap-2 rounded-gds-lg bg-gds-gray-200 bg-cover bg-center p-8 shadow-[inset_0_0_0_1px_var(--color-gds-gray-200)] max-[480px]:min-h-[200px] max-[480px]:p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.78)), url(${banner.image})`,
      }}
    >
      <p className="max-w-xl text-sm font-semibold text-gds-green-700">{banner.description}</p>
      <h1 className="max-w-2xl text-3xl leading-tight font-bold tracking-tight text-gds-gray-900 sm:text-4xl">
        {banner.title}
      </h1>
    </section>
  );
}
