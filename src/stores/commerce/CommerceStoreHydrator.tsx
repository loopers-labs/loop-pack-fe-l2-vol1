"use client";

import { useEffect } from "react";
import { useCommerceStore } from "./store";

export function CommerceStoreHydrator() {
  useEffect(() => {
    void useCommerceStore.persist.rehydrate();
  }, []);

  return null;
}
