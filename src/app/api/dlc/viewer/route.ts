import { NextRequest } from "next/server";
import { viewerResponse } from "@/dlc-starter/viewer";

export async function GET(request: NextRequest) {
  return viewerResponse(request, "web");
}
