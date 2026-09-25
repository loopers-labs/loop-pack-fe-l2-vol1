import { timingSafeEqual } from "node:crypto";

export const DLC_GRADER_TOKEN_HEADER = "x-dlc-grader-token";

const tokensEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
};

/**
 * Internal fixture routes require both an explicit runtime opt-in and a secret token.
 * Network policy is still expected to keep these routes off the public ingress.
 */
export function internalGraderDenial(request: Request): Response | null {
  if (process.env.DLC_GRADER_ENABLED !== "true") {
    return new Response(null, { status: 404 });
  }

  const configuredToken = process.env.DLC_GRADER_TOKEN;
  const suppliedToken = request.headers.get(DLC_GRADER_TOKEN_HEADER);
  if (!configuredToken || !suppliedToken || !tokensEqual(configuredToken, suppliedToken)) {
    return Response.json({ message: "grader access denied" }, { status: 403 });
  }

  return null;
}
