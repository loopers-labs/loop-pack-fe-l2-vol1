export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message = "HTTP request failed") {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
