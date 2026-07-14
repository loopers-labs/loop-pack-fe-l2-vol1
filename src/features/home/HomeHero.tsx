import type { HomeResponse } from "./api/homeApi";

type HomeHeroProps = {
  banner: HomeResponse["banner"];
};

export function HomeHero({ banner }: HomeHeroProps) {
  return (
    <section
      className="flex min-h-[220px] flex-col justify-end gap-2 bg-[#ececec] bg-cover bg-center p-8 max-[480px]:min-h-[180px] max-[480px]:p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url(${banner.image})`,
      }}
    >
      <p>{banner.description}</p>
      <h1>{banner.title}</h1>
    </section>
  );
}
