// src/test/render-with-providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import type { ReactNode } from "react";

type Options = {
  searchParams?: string;
  onUrlUpdate?: (event: UrlUpdateEvent) => void;
};

export function renderWithProviders(
  ui: ReactNode,
  { searchParams = "", onUrlUpdate }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
        {ui}
      </NuqsTestingAdapter>
    </QueryClientProvider>,
  );
}
