"use client";

import { Suspense, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Header } from "./header";
import styles from "./commerce.module.css";

export function CommerceProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <div className={styles.shell}>
        <Header />
        <Suspense fallback={null}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </Suspense>
      </div>
    </QueryClientProvider>
  );
}
