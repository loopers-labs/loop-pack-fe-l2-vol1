import { NextRequest, NextResponse } from "next/server";
import { DLC_BARRIER_ID_HEADER, waitAtDlcBarrier } from "./barrier";
import {
  DlcConfigurationError,
  DLC_SESSION_COOKIE,
  dlcResponseHeaders,
  type DlcApp,
  verifyDlcSessionToken,
} from "./session";

export async function viewerResponse(request: NextRequest, app: DlcApp): Promise<Response> {
  const headers = new Headers(dlcResponseHeaders(request));
  try {
    const viewer = verifyDlcSessionToken(
      request.cookies.get(DLC_SESSION_COOKIE[app])?.value,
      app,
    );
    if (!viewer) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401, headers });
    }
    const barrierDenial = await waitAtDlcBarrier(request);
    if (barrierDenial) {
      return barrierDenial;
    }
    const barrierId = request.headers.get(DLC_BARRIER_ID_HEADER);
    if (barrierId) {
      headers.set(DLC_BARRIER_ID_HEADER, barrierId);
    }
    return NextResponse.json({ viewer }, { headers });
  } catch (error) {
    if (error instanceof DlcConfigurationError) {
      return NextResponse.json(
        { message: "session verifier is not configured" },
        { status: 503, headers },
      );
    }
    throw error;
  }
}

export function viewerFromRequest(request: NextRequest, app: DlcApp) {
  return verifyDlcSessionToken(request.cookies.get(DLC_SESSION_COOKIE[app])?.value, app);
}
