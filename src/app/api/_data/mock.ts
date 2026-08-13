const DEFAULT_DELAY_MS = process.env.NODE_ENV === "test" ? 0 : 500;

export const waitForMockApi = (ms: number = DEFAULT_DELAY_MS) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
