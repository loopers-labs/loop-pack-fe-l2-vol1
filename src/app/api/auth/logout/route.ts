import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
