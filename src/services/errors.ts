export class UnauthorizedError extends Error {
  constructor(message = "Your session has ended. Please sign in again.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "This item could not be found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && error.name === "UnauthorizedError";
}

export function isNotFound(error: unknown): boolean {
  return error instanceof Error && error.name === "NotFoundError";
}
