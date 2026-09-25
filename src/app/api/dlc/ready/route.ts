import { NextRequest, NextResponse } from "next/server";
import { commerceApiIsReady } from "@/dlc-starter/commerce-api";
import { dlcResponseHeaders, hasDlcSessionConfiguration } from "@/dlc-starter/session";

export async function GET(request: NextRequest) {
  const sessionConfigured = hasDlcSessionConfiguration("web");
  const commerceReady = await commerceApiIsReady();
  const ready = sessionConfigured && commerceReady;
  return NextResponse.json(
    { status: ready ? "ready" : "not-ready", checks: { sessionConfigured, commerceReady } },
    { status: ready ? 200 : 503, headers: dlcResponseHeaders(request) },
  );
}
