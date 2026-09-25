import type { DlcAccount } from "./session";

export type AdminOrder = {
  id: string;
  customerId: string;
  status: string;
  items?: unknown[];
};

const commerceApiUrl = (): URL => {
  const rawUrl = process.env.COMMERCE_API_URL;
  if (!rawUrl) {
    throw new Error("COMMERCE_API_URL is required");
  }
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("COMMERCE_API_URL must use http or https");
  }
  return url;
};

const commerceHeaders = (viewer: DlcAccount): HeadersInit => {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-dlc-viewer-id": viewer.id,
    "x-dlc-viewer-role": viewer.role,
  };
  if (process.env.COMMERCE_API_TOKEN) {
    headers.authorization = `Bearer ${process.env.COMMERCE_API_TOKEN}`;
  }
  return headers;
};

export async function listAdminOrders(
  viewer: DlcAccount,
  fetchImplementation: typeof fetch = fetch,
): Promise<Response> {
  return fetchImplementation(new URL("/orders", commerceApiUrl()), {
    method: "GET",
    headers: commerceHeaders(viewer),
    cache: "no-store",
  });
}

export async function updateAdminOrderStatus(
  viewer: DlcAccount,
  orderId: string,
  status: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<Response> {
  return fetchImplementation(
    new URL(`/orders/${encodeURIComponent(orderId)}/status`, commerceApiUrl()),
    {
      method: "PATCH",
      headers: { ...commerceHeaders(viewer), "content-type": "application/json" },
      body: JSON.stringify({ status }),
      cache: "no-store",
    },
  );
}

export async function commerceApiIsReady(
  fetchImplementation: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImplementation(
      new URL(process.env.COMMERCE_API_READINESS_PATH ?? "/ready", commerceApiUrl()),
      { cache: "no-store", signal: AbortSignal.timeout(2_000) },
    );
    return response.ok;
  } catch {
    return false;
  }
}
