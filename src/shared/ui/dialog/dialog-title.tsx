import type { ComponentPropsWithoutRef, ReactElement } from "react";

export function DialogTitle({ style, ...rest }: ComponentPropsWithoutRef<"h2">): ReactElement {
  return <h2 {...rest} style={{ margin: 0, fontSize: 18, fontWeight: 700, ...style }} />;
}
