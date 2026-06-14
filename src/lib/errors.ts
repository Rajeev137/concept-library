import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { ErrorCode, ApiError } from "@/types";

// Thrown inside API route handlers; caught by the apiHandler wrapper and serialized.
export class ApiRouteError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly fields?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

// TODO: Serialize an ApiRouteError (or unknown error) into a JSON NextResponse.
// For ApiRouteError: use code/message/status from the error; include fields for VALIDATION,
// trace_id for INTERNAL. For unknown errors: log the real error server-side, return 500
// with a fresh trace_id and opaque message — never expose stack traces or env values.
export function errorResponse(err: unknown): NextResponse<ApiError> {
  // TODO: if (err instanceof ApiRouteError) { ... }
  // TODO: const trace_id = randomUUID(); console.error({ trace_id, err }); return NextResponse.json(...)
  throw err;
}

// TODO: Wrap an API route handler function so that any thrown ApiRouteError or unexpected
// error is caught and serialized via errorResponse(). All route handlers use this wrapper.
// Accepts a handler that takes any arguments (request + params) and returns a NextResponse.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiHandler<TArgs extends any[], T>(
  fn: (...args: TArgs) => Promise<NextResponse<T>>
): (...args: TArgs) => Promise<NextResponse> {
  // TODO: return async (...args) => { try { return await fn(...args) } catch (err) { return errorResponse(err) } }
  return fn as unknown as (...args: TArgs) => Promise<NextResponse>;
}
