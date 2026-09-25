import type { Timestamp } from "@fixture/format/types";
import { formatTimestamp } from "@fixture/format";
import "@scope/external-package";
import { localTitle } from "./title";

export function page(value: Timestamp): string {
  return `${localTitle}: ${formatTimestamp(value)}`;
}
