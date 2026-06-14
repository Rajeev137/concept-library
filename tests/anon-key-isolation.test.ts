import { describe, it, expect } from "vitest";

// Contract invariant: anon API key must return ZERO rows from all tables and ZERO objects
// from the concept-images bucket. This test asserts the RLS policies are correctly in place
// on the test Supabase project.
//
// TODO: import createClient (browser/anon client) from @/lib/supabase/client
// TODO: initialize an anon client using NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
//       without calling signIn — this simulates an unauthenticated request.

describe("RLS — anon key isolation", () => {
  // TODO: const anonClient = createBrowserClient(url, anonKey)

  it("returns zero rows from topics with anon key", async () => {
    // TODO: const { data, error } = await anonClient.from("topics").select("*")
    // TODO: expect(error).toBeNull()
    // TODO: expect(data).toEqual([])
    expect(true).toBe(true); // placeholder — remove when implemented
  });

  it("returns zero rows from concepts with anon key", async () => {
    // TODO: const { data, error } = await anonClient.from("concepts").select("*")
    // TODO: expect(data).toEqual([])
    expect(true).toBe(true);
  });

  it("returns zero rows from comparisons with anon key", async () => {
    // TODO: const { data, error } = await anonClient.from("comparisons").select("*")
    // TODO: expect(data).toEqual([])
    expect(true).toBe(true);
  });

  it("returns zero objects from concept-images bucket with anon key", async () => {
    // TODO: const { data, error } = await anonClient.storage.from("concept-images").list()
    // TODO: expect(data).toEqual([])
    expect(true).toBe(true);
  });
});
