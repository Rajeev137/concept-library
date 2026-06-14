import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Contract invariant: anon API key must return ZERO rows from all tables and ZERO objects
// from the concept-images bucket. This test asserts the RLS policies are correctly in place
// on the test Supabase project.

function loadEnvLocal(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    return Object.fromEntries(
      raw
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => {
          const idx = line.indexOf("=");
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

describe("RLS — anon key isolation", () => {
  let anonClient: SupabaseClient;

  beforeAll(() => {
    const local = loadEnvLocal();
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? local["NEXT_PUBLIC_SUPABASE_URL"];
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      local["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    if (!url || !anonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
      );
    }
    anonClient = createClient(url, anonKey);
  });

  it("returns zero rows from topics with anon key", async () => {
    const { data, error } = await anonClient.from("topics").select("*");
    // 42501 = permission denied by RLS (no SELECT policy); both outcomes prove isolation
    if (error) expect(error.code).toBe("42501");
    else expect(data).toEqual([]);
  });

  it("returns zero rows from concepts with anon key", async () => {
    const { data, error } = await anonClient.from("concepts").select("*");
    if (error) expect(error.code).toBe("42501");
    else expect(data).toEqual([]);
  });

  it("returns zero rows from comparisons with anon key", async () => {
    const { data, error } = await anonClient.from("comparisons").select("*");
    if (error) expect(error.code).toBe("42501");
    else expect(data).toEqual([]);
  });

  it("returns zero objects from concept-images bucket with anon key", async () => {
    const { data, error } = await anonClient.storage
      .from("concept-images")
      .list();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
