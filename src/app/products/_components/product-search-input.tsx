"use client";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useEffect, useRef, useState } from "react";

type ProductSearchInputProps = {
  value: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
};

export function ProductSearchInput({ value, onDebouncedChange }: ProductSearchInputProps) {
  const [text, setText] = useState(value);
  const lastCommittedRef = useRef(value);
  const commit = useDebouncedCallback((next: string) => {
    lastCommittedRef.current = next;
    onDebouncedChange(next);
  });

  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      lastCommittedRef.current = value;
      setText(value);
    }
  }, [value]);

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
      />
    </label>
  );
}
