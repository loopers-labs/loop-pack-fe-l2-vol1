import type { HomeResponse } from "../api/get-home";

type HomeBannerProps = {
  banner: HomeResponse["banner"];
};

export function HomeBanner({ banner }: HomeBannerProps) {
  return (
    <section className="week05-hero">
      <p>{banner.description}</p>
      <h1>{banner.title}</h1>
    </section>
  );
}
