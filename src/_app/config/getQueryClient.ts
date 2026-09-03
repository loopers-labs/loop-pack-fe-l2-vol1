import { QueryClient, environmentManager } from "@tanstack/react-query";
import { createAppQueryClient } from "@/shared/config/queryClient";

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    return createAppQueryClient();
  } else {
    if (!browserQueryClient) {
      browserQueryClient = createAppQueryClient();
    }
    return browserQueryClient;
  }
}
