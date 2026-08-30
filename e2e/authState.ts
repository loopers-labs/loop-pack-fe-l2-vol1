export const authStateCount = 8;

export const authStatePath = (index: number) => `e2e/.auth/user-${index}.json`;

export const authAccount = (index: number) => ({
  email: `looper${index + 1}@loopers.dev`,
  password: "looper1234",
});
