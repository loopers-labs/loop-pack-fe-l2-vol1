import { NextRequest, NextResponse } from "next/server";
import { listAdminOrders } from "@/dlc-starter/commerce-api";
import { dlcResponseHeaders } from "@/dlc-starter/session";
import { viewerFromRequest } from "@/dlc-starter/viewer";

export async function GET(request: NextRequest) {
  const headers = dlcResponseHeaders(request);
  const viewer = viewerFromRequest(request, "admin");
  if (!viewer) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401, headers });
  }

  try {
    const upstream = await listAdminOrders(viewer);
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { ...headers, "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "commerce api unavailable" },
      { status: 502, headers },
    );
  }
}
