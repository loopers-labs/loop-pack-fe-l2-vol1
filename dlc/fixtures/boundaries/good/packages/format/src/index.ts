import type { Timestamp } from "./types";

export function formatTimestamp(value: Timestamp): string {
  return value.iso;
}
