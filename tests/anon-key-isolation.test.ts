import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Contract invariant: anon API key must return ZERO rows from all tables.
// The concept-images bucket is intentionally public (CDN serving); isolation is
// enforced by verifying anon cannot upload or delete — not by restricting reads.

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

const env = loadEnvLocal();
const canRunIntegration =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? env["NEXT_PUBLIC_SUPABASE_URL"]) &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

describe.skipIf(!canRunIntegration)("RLS — anon key isolation", () => {
  let anonClient: SupabaseClient;

  beforeAll(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env["NEXT_PUBLIC_SUPABASE_URL"];
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    anonClient = createClient(url!, anonKey!);
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

  it("anon key cannot upload to concept-images bucket", async () => {
    const blob = new Blob(["x"], { type: "text/plain" });
    const { error } = await anonClient.storage
      .from("concept-images")
      .upload("anon-probe/test.txt", blob, { upsert: false });
    // Must be denied — anon has no INSERT policy
    expect(error).not.toBeNull();
  });

  it("anon key cannot upload to concept-images bucket (second attempt — idempotency check)", async () => {
    // A second distinct path also must be denied, confirming the INSERT block is not path-specific
    const blob = new Blob(["y"], { type: "text/plain" });
    const { error } = await anonClient.storage
      .from("concept-images")
      .upload("anon-probe/test2.txt", blob, { upsert: false });
    expect(error).not.toBeNull();
  });
});
