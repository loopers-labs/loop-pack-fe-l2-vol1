"use client";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useState } from "react";

type ProductSearchInputProps = {
  initialValue: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
};

export function ProductSearchInput({ initialValue, onDebouncedChange }: ProductSearchInputProps) {
  const [text, setText] = useState(initialValue);
  const commit = useDebouncedCallback(onDebouncedChange);

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
