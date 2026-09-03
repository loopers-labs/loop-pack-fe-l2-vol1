"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect } from "react";
import { getQueryClient } from "@/_app/config/getQueryClient";
import { consoleProvider } from "@/analytics/consoleProvider";
import { initAnalytics, registerProviders, setCommonProperties } from "@/analytics/logger";
import { CommerceStoreHydrator } from "./CommerceStoreHydrator";

const ANALYTICS_SESSION_ID_KEY = "commerce.analytics.sessionId";

function getOrCreateSessionId() {
  const storedSessionId = window.sessionStorage.getItem(ANALYTICS_SESSION_ID_KEY);

  if (storedSessionId !== null) {
    return storedSessionId;
  }

  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(ANALYTICS_SESSION_ID_KEY, sessionId);
  return sessionId;
}

function getDevice() {
  if (typeof window.matchMedia !== "function") {
    return "desktop";
  }

  if (window.matchMedia("(max-width: 640px)").matches) {
    return "mobile";
  }

  if (window.matchMedia("(max-width: 1024px)").matches) {
    return "tablet";
  }

  return "desktop";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    registerProviders([consoleProvider]);
    setCommonProperties(() => {
      return {
        sessionId: getOrCreateSessionId(),
        device: getDevice(),
        path: `${window.location.pathname}${window.location.search}`,
        ts: new Date().toISOString(),
      };
    });
    void initAnalytics();
  }, []);

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <CommerceStoreHydrator />
        {children}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
