"use client";

import { useEffect } from "react";
import { useCommerceStore } from "@/_app/model/commerceStore";

export function CommerceStoreHydrator() {
  useEffect(() => {
    void useCommerceStore.persist.rehydrate();
  }, []);

  return null;
}
