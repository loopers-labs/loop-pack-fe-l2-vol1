import { NextRequest, NextResponse } from "next/server";
import { dlcResponseHeaders } from "@/dlc-starter/session";

export function GET(request: NextRequest) {
  return NextResponse.json(
    { status: "ok", app: "web" },
    { headers: dlcResponseHeaders(request) },
  );
}
