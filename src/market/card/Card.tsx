import { type ReactNode, useCallback, useId, useState } from "react";

import styles from "./Card.module.css";
import { CardContext } from "./CardContext";

interface CardProps {
  children: ReactNode;
  className?: string;
}

// <section>을 접근성 랜드마크로 노출하려면 aria-labelledby가 제목(CardTitle)을 가리켜야 하는데, 그 제목은 자식으로 들어오는 상태.
// 부모(section)가 자식이 만든 id를 알아야 연결되므로 props 전달로는 불가능 → Context로 titleId를 공유함.
// CardTitle 유무에 따라 aria-labelledby를 켜고 끄려고 registerTitle도 함께 전달.
export function Card({ children, className }: CardProps) {
  const titleId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const registerTitle = useCallback((present: boolean) => setHasTitle(present), []);

  return (
    <CardContext.Provider value={{ titleId, registerTitle }}>
      <section
        className={`${styles.card} ${className ?? ""}`}
        aria-labelledby={hasTitle ? titleId : undefined}
      >
        {children}
      </section>
    </CardContext.Provider>
  );
}
