import { describe, expect, it } from "vitest";
import {
  REQUIRED_CALCULATION_ITERATIONS,
  runRequiredCardCalculation,
} from "./required-card-calculation";

describe("Advanced A required card calculation", () => {
  it("keeps the required repeated work in the visible card result", () => {
    const result = runRequiredCardCalculation({
      calculationSeed: 7,
      price: 32900,
    });

    expect(REQUIRED_CALCULATION_ITERATIONS).toBe(250_000);
    expect(result).toEqual({
      workUnits: 2_875_000,
      rewardPoints: 987,
      shippingReadiness: 65,
    });
  });

  it("returns the same result for the same fixture input", () => {
    const input = { calculationSeed: 12, price: 44900 };

    expect(runRequiredCardCalculation(input)).toEqual(
      runRequiredCardCalculation(input),
    );
  });
});
