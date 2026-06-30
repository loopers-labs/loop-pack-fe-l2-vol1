import { type ReactNode, useEffect } from "react";

import styles from "./Card.module.css";
import { useCardContext } from "./CardContext";

interface CardTitleProps {
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
}

// header/body/title을 slot prop(header=, body=)이 아니라 compound로 둔 이유:
// 머리말 구성이 카드마다 다름(제목만 / 제목+버튼 / 제목 없음).
// slot prop은 고정된 영역에 적합하지만, 여기선 호출자가 자유롭게 조합해야 해서 children 기반 compound를 선택
// CardTitle을 별도로 둔 건 접근성 연결(useId→id, registerTitle 등록)을 이 조각이 캡슐화하기 위함.
//호출자는 <Card.Title>만 쓰면 id를 몰라도 aria-labelledby가 붙음.

export function CardTitle({ children, as: Heading = "h2" }: CardTitleProps) {
  const { titleId, registerTitle } = useCardContext();

  useEffect(() => {
    registerTitle(true);
    return () => registerTitle(false);
  }, [registerTitle]);

  return (
    <Heading id={titleId} className={styles.title}>
      {children}
    </Heading>
  );
}
