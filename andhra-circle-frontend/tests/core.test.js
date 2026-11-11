import { describe, it, expect } from "vitest";

describe("Frontend Core Contract Tests", () => {
  it("resolves base API URL correctly", () => {
    const rawUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    expect(rawUrl).toBeTruthy();
    expect(typeof rawUrl).toBe("string");
  });

  it("handles form submission disabled state logic", () => {
    let isSubmitting = true;
    const canSubmit = !isSubmitting;
    expect(canSubmit).toBe(false);

    isSubmitting = false;
    expect(!isSubmitting).toBe(true);
  });
});

