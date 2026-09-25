import { internalGraderDenial } from "./internal-grader";

export const DLC_BARRIER_ID_HEADER = "x-dlc-barrier-id";

type Barrier = {
  arrivals: number;
  release: () => void;
  promise: Promise<void>;
  timeout: ReturnType<typeof setTimeout>;
};

const barriers = new Map<string, Barrier>();

const externalBarrierUrl = (): URL | null => {
  const value = process.env.DLC_BARRIER_URL;
  return value ? new URL(value) : null;
};

const timeoutMs = (): number => {
  const configured = Number(process.env.DLC_BARRIER_TIMEOUT_MS ?? 3_000);
  return Number.isFinite(configured) && configured > 0 ? configured : 3_000;
};

const arrive = (barrierId: string): Promise<void> => {
  const existing = barriers.get(barrierId);
  if (existing) {
    existing.arrivals += 1;
    if (existing.arrivals >= 2) {
      clearTimeout(existing.timeout);
      barriers.delete(barrierId);
      existing.release();
    }
    return existing.promise;
  }

  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  const timeout = setTimeout(() => {
    barriers.delete(barrierId);
    release();
  }, timeoutMs());
  barriers.set(barrierId, { arrivals: 1, release, promise, timeout });
  return promise;
};

const arriveAtMentorBarrier = async (request: Request, barrierId: string, baseUrl: URL) => {
  const token = process.env.DLC_BARRIER_ARRIVAL_TOKEN;
  if (!token) {
    throw new Error("DLC_BARRIER_ARRIVAL_TOKEN is required when DLC_BARRIER_URL is set");
  }
  const requestId = request.headers.get("x-dlc-request-id");
  if (!requestId) {
    throw new Error("x-dlc-request-id is required for mentor barrier evidence");
  }
  const response = await fetch(
    new URL(`/__grader/barriers/${encodeURIComponent(barrierId)}/arrive`, baseUrl),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ requestId }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs() + 2_000),
    },
  );
  if (!response.ok) {
    throw new Error(`mentor barrier arrival failed: ${response.status}`);
  }
};

/**
 * Called only after the viewer identity has been resolved. Two requests carrying the
 * same barrier id are released together, making process-global identity mutations
 * fail deterministically in the grader.
 */
export async function waitAtDlcBarrier(request: Request): Promise<Response | null> {
  const barrierId = request.headers.get(DLC_BARRIER_ID_HEADER);
  if (!barrierId) {
    return null;
  }

  const denial = internalGraderDenial(request);
  if (denial) {
    return denial;
  }

  const mentorUrl = externalBarrierUrl();
  if (mentorUrl) {
    await arriveAtMentorBarrier(request, barrierId, mentorUrl);
  } else {
    await arrive(barrierId);
  }
  return null;
}

export function resetDlcBarriersForTest(): void {
  for (const barrier of barriers.values()) {
    clearTimeout(barrier.timeout);
    barrier.release();
  }
  barriers.clear();
}
