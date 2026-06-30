import { createContext, useContext } from "react";

interface CardContextValue {
  titleId: string;
  registerTitle: (present: boolean) => void;
}

export const CardContext = createContext<CardContextValue | null>(null);

export function useCardContext() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error("Card.* 는 <Card> 안에서만 쓸 수 있어요.");
  return ctx;
}
