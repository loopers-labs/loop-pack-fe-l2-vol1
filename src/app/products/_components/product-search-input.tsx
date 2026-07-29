"use client";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useEffect, useRef, useState } from "react";

type ProductSearchInputProps = {
  value: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
};

export function ProductSearchInput({ value, onDebouncedChange, delay }: ProductSearchInputProps) {
  const [text, setText] = useState(value);
  const lastCommittedRef = useRef(value);
  const commit = useDebouncedCallback((next: string) => {
    lastCommittedRef.current = next;
    onDebouncedChange(next);
  }, delay);

  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      commit.cancel();
      lastCommittedRef.current = value;
      setText(value);
    }
  }, [value, commit]);

  return (
    <label>
      검색
      <input
        name="q"
        placeholder="상품명 또는 브랜드"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          commit(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            commit.flush();
          }
        }}
      />
    </label>
  );
}
