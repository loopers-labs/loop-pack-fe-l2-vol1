import type { ComponentPropsWithoutRef, ReactElement } from "react";

export function DialogDescription({ style, ...rest }: ComponentPropsWithoutRef<"p">): ReactElement {
  return (
    <p
      {...rest}
      style={{ margin: "8px 0 0", fontSize: 14, color: "#5a6675", lineHeight: 1.6, ...style }}
    />
  );
}
