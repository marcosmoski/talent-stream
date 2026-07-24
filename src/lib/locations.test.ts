import { describe, it, expect } from "vitest";
import { normalizeLocation } from "@/lib/locations";

describe("normalizeLocation", () => {
  const cases: Array<[string, string]> = [
    ["Lisbon", "Lisboa, PT"],
    ["lisbon", "Lisboa, PT"],
    ["Lisbon, PT", "Lisboa, PT"],
    ["Lisboa", "Lisboa, PT"],
    ["Oporto", "Porto, PT"],
    ["porto", "Porto, PT"],
    ["Évora", "Évora, PT"],
    ["evora", "Évora, PT"],
    ["remote", "Remote"],
    ["  Braga  ", "Braga, PT"],
    ["Some Village, XX", "Some Village, XX"], // unknown -> untouched
    ["", ""],
  ];
  for (const [input, expected] of cases) {
    it(`"${input}" -> "${expected}"`, () => {
      expect(normalizeLocation(input)).toBe(expected);
    });
  }
});
