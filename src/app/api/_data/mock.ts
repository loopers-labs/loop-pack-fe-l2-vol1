const mockDelayMs = process.env.NODE_ENV === "test" ? 0 : 500;

export const waitForMockApi = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, mockDelayMs);
  });
