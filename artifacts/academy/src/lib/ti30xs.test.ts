import { describe, it, expect } from "vitest";
import { evaluateExpression, formatResult } from "./ti30xs";

describe("evaluateExpression", () => {
  it("does basic arithmetic with precedence", () => {
    expect(evaluateExpression("2+3×4")).toBe(14);
    expect(evaluateExpression("(2+3)×4")).toBe(20);
    expect(evaluateExpression("10÷4")).toBe(2.5);
    expect(evaluateExpression("7-10")).toBe(-3);
  });
  it("handles TI keys: x², √, ^, %, π", () => {
    expect(evaluateExpression("5²")).toBe(25);
    expect(evaluateExpression("√(144)")).toBe(12);
    expect(evaluateExpression("√9")).toBe(3);
    expect(evaluateExpression("2^10")).toBe(1024);
    expect(evaluateExpression("50%")).toBe(0.5);
    expect(evaluateExpression("200×15%")).toBeCloseTo(30);
    expect(evaluateExpression("π")).toBeCloseTo(Math.PI);
  });
  it("honors implicit multiplication and unary minus", () => {
    expect(evaluateExpression("2(3+4)")).toBe(14);
    expect(evaluateExpression("2π")).toBeCloseTo(2 * Math.PI);
    expect(evaluateExpression("-3²")).toBe(9); // unary minus binds into the primary: (-3)²
    expect(evaluateExpression("3×-4")).toBe(-12);
  });
  it("rejects invalid input without eval", () => {
    expect(() => evaluateExpression("1÷0")).toThrow();
    expect(() => evaluateExpression("√(-1)")).toThrow();
    expect(() => evaluateExpression("2+")).toThrow();
    expect(() => evaluateExpression("")).toThrow();
    expect(() => evaluateExpression("alert(1)")).toThrow();
  });
});

describe("formatResult", () => {
  it("trims to TI-style display precision", () => {
    expect(formatResult(2)).toBe("2");
    expect(formatResult(1 / 3)).toBe("0.3333333333");
    expect(formatResult(2.5)).toBe("2.5");
  });
});
