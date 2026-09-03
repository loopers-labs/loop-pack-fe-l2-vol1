import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import type { ReactElement } from "react";
import { createAppQueryClient } from "@/shared/config/queryClient";

type RenderWithAppProvidersOptions = {
  route?: string;
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
  withNuqs?: boolean;
  hasMemory?: boolean;
};

export function renderWithAppProviders(
  ui: ReactElement,
  {
    route = "/",
    searchParams = "",
    onUrlUpdate,
    withNuqs = false,
    hasMemory = true,
  }: RenderWithAppProvidersOptions = {},
) {
  window.history.replaceState(null, "", `${route}${searchParams}`);

  const queryClient = createAppQueryClient();
  const content = withNuqs ? (
    <NuqsTestingAdapter searchParams={searchParams} hasMemory={hasMemory} onUrlUpdate={onUrlUpdate}>
      {ui}
    </NuqsTestingAdapter>
  ) : (
    ui
  );

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{content}</QueryClientProvider>),
  };
}
