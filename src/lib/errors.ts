import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { ErrorCode, ApiError } from "@/types";

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

export function errorResponse(err: unknown): NextResponse<ApiError> {
  if (err instanceof ApiRouteError) {
    const body: ApiError = {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
        ...(err.code === "INTERNAL" ? { trace_id: randomUUID() } : {}),
      },
    };
    return NextResponse.json(body, { status: err.status });
  }

  const trace_id = randomUUID();
  console.error({ trace_id, err });
  const body: ApiError = {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "An unexpected error occurred.",
      trace_id,
    },
  };
  return NextResponse.json(body, { status: 500 });
}

const RESPONSE_FLOOR_MS = 250;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiHandler<TArgs extends any[], T>(
  fn: (...args: TArgs) => Promise<NextResponse<T>>,
  { minMs = 0 }: { minMs?: number } = {}
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs): Promise<NextResponse> => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      if (minMs > 0) {
        const elapsed = Date.now() - start;
        if (elapsed < minMs) {
          await new Promise((r) => setTimeout(r, minMs - elapsed));
        }
      }
      return result;
    } catch (err) {
      if (minMs > 0) {
        const elapsed = Date.now() - start;
        if (elapsed < minMs) {
          await new Promise((r) => setTimeout(r, minMs - elapsed));
        }
      }
      return errorResponse(err);
    }
  };
}

// Pre-configured wrapper for auth endpoints that enforces the 250ms floor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function authHandler<TArgs extends any[], T>(
  fn: (...args: TArgs) => Promise<NextResponse<T>>
): (...args: TArgs) => Promise<NextResponse> {
  return apiHandler(fn, { minMs: RESPONSE_FLOOR_MS });
}
