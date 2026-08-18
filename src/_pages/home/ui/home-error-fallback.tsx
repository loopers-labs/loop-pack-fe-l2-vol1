import { CommerceApiError } from "@/shared/api/commerce-client";
import { Placeholder } from "@/shared/ui/placeholder";
import { HeroSection } from "./hero-section";

type HomeErrorFallbackProps = {
  error: Error;
  retry: () => void;
};

export function HomeErrorFallback({ error, retry }: HomeErrorFallbackProps) {
  return (
    <>
      <section className="week05-hero" aria-hidden="true" />
      <HeroSection />
      <Placeholder
        role="alert"
        title="상품을 불러오지 못했어요"
        description={
          error instanceof CommerceApiError ? error.message : "잠시 후 다시 시도해 주세요."
        }
        action={
          <button type="button" onClick={retry}>
            다시 시도
          </button>
        }
      />
    </>
  );
}
