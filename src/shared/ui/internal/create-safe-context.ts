import { createContext, use, type Context } from "react";

export function createSafeContext<T>(name: string): [Context<T | null>, (part: string) => T] {
  const SafeContext = createContext<T | null>(null);

  const useSafeContext = (part: string): T => {
    const contextValue = use(SafeContext);
    if (contextValue === null) {
      throw new Error(`<${name}.${part}>은 <${name}> 안에서만 사용할 수 있습니다`);
    }
    return contextValue;
  };

  return [SafeContext, useSafeContext];
}
