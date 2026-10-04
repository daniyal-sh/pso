import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { selectAllRows } from "@/lib/supabase/server";

describe("selectAllRows", () => {
  it("keeps requesting pages until a short page arrives", async () => {
    const rows = Array.from({ length: 2500 }, (_, index) => index);
    const ranges: [number, number][] = [];
    const result = await selectAllRows<number>(async (from, to) => {
      ranges.push([from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(result.data).toHaveLength(2500);
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("stops after an exact multiple of the page size", async () => {
    const result = await selectAllRows<number>(async (from) => ({ data: from === 0 ? [1, 2] : [], error: null }), 2);
    expect(result.data).toEqual([1, 2]);
  });

  it("gives up instead of looping forever when paging is ignored", async () => {
    let calls = 0;
    const result = await selectAllRows<number>(async () => {
      calls += 1;
      return { data: [1, 2], error: null };
    }, 2, 5);
    expect(calls).toBe(5);
    expect(result.data).toBeNull();
    expect(result.error?.message).toMatch(/exceeded/);
  });

  it("returns the error instead of partial data", async () => {
    const result = await selectAllRows<number>(async () => ({ data: null, error: { message: "boom" } }));
    expect(result).toEqual({ data: null, error: { message: "boom" } });
  });
});
