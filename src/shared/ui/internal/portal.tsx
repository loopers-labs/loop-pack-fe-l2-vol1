"use client";

import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function Portal({ children }: PortalProps): ReactElement | null {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
