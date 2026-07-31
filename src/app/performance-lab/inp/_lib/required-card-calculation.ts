export const REQUIRED_CALCULATION_ITERATIONS = 250_000;

type RequiredCardCalculationInput = Readonly<{
  calculationSeed: number;
  price: number;
}>;

export type RequiredCardCalculationResult = Readonly<{
  workUnits: number;
  rewardPoints: number;
  shippingReadiness: number;
}>;

export function runRequiredCardCalculation({
  calculationSeed,
  price,
}: RequiredCardCalculationInput): RequiredCardCalculationResult {
  let workUnits = 0;

  for (let index = 0; index < REQUIRED_CALCULATION_ITERATIONS; index += 1) {
    workUnits += (index % 10) + calculationSeed;
  }

  return {
    workUnits,
    rewardPoints: Math.floor(price * 0.03),
    shippingReadiness: 58 + calculationSeed,
  };
}
