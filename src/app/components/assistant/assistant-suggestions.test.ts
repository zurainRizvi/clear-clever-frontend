import { describe, expect, it } from "vitest";
import { getAssistantSuggestions } from "./assistant-suggestions";

describe("getAssistantSuggestions", () => {
  it("returns visual and general chips for guests", () => {
    const chips = getAssistantSuggestions({ isAuthenticated: false, role: null });
    expect(chips.length).toBeGreaterThanOrEqual(6);
    expect(chips.some((c) => c.id === "categories-chart")).toBe(true);
    expect(chips.some((c) => c.prompt.includes("```chart"))).toBe(true);
  });

  it("returns visual chips for seekers", () => {
    const chips = getAssistantSuggestions({ isAuthenticated: true, role: "user", category: "auto" });
    expect(chips.some((c) => c.id === "chart-premiums")).toBe(true);
    expect(chips.some((c) => c.id === "compare-visual")).toBe(true);
    expect(chips.some((c) => c.text.includes("auto"))).toBe(true);
  });

  it("returns visual chips for insurer, admin, and superadmin", () => {
    for (const role of ["insurer", "admin", "superadmin"] as const) {
      const chips = getAssistantSuggestions({ isAuthenticated: true, role });
      expect(chips.length).toBeGreaterThanOrEqual(6);
      expect(chips.some((c) => c.prompt.includes("```chart") || c.prompt.includes("```stats"))).toBe(
        true,
      );
    }
  });
});
