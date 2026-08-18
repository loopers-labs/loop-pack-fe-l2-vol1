"use client";

import { Suspense } from "react";
import { CommerceApiError } from "@/shared/api/commerce-client";
import { ErrorBoundary } from "@/shared/ui/error-boundary";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { MockApiScenario } from "@/types/commerce";
import { HomeContent } from "./home-content";
import { HomeErrorFallback } from "./home-error-fallback";
import { HomePendingFallback } from "./home-pending-fallback";

const isServerError = (error: Error) => error instanceof CommerceApiError && error.status >= 500;

type HomePageProps = {
  scenario: MockApiScenario | null;
};

export function HomePage({ scenario }: HomePageProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      shouldCatch={(error) => !isServerError(error)}
      fallback={(error, retry) => <HomeErrorFallback error={error} retry={retry} />}
    >
      <Suspense fallback={<HomePendingFallback />}>
        <HomeContent scenario={scenario} />
      </Suspense>
    </ErrorBoundary>
  );
}
