import { NextRequest, NextResponse } from "next/server";
import { updateAdminOrderStatus } from "@/dlc-starter/commerce-api";
import { dlcResponseHeaders } from "@/dlc-starter/session";
import { viewerFromRequest } from "@/dlc-starter/viewer";

const ORDER_STATUSES = ["pending", "paid", "preparing", "shipped", "cancelled"] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const headers = dlcResponseHeaders(request);
  const viewer = viewerFromRequest(request, "admin");
  if (!viewer) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "invalid status" }, { status: 400, headers });
  }
  const status =
    typeof body === "object" && body !== null && "status" in body ? body.status : undefined;
  if (typeof status !== "string" || !ORDER_STATUSES.some((item) => item === status)) {
    return NextResponse.json({ message: "invalid status" }, { status: 400, headers });
  }

  try {
    const { orderId } = await context.params;
    const upstream = await updateAdminOrderStatus(viewer, orderId, status);
    const responseBody = await upstream.text();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        ...headers,
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "commerce api unavailable" },
      { status: 502, headers },
    );
  }
}
