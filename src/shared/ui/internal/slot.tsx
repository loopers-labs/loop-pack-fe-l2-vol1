import { cloneElement, type CSSProperties, type ReactElement, type SyntheticEvent } from "react";

import { composeEventHandlers } from "./compose-event-handlers";

type UnknownProps = Record<string, unknown>;
type EventHandler = (event: SyntheticEvent) => void;

interface SlotProps extends UnknownProps {
  children: ReactElement<UnknownProps>;
}

const isEventHandlerKey = (key: string): boolean => /^on[A-Z]/.test(key);

function mergeProps(slotProps: UnknownProps, childProps: UnknownProps): UnknownProps {
  const merged: UnknownProps = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    if (isEventHandlerKey(key) && typeof slotValue === "function") {
      merged[key] =
        typeof childValue === "function"
          ? composeEventHandlers(childValue as EventHandler, slotValue as EventHandler)
          : slotValue;
    } else if (key === "style") {
      merged[key] = { ...(slotValue as CSSProperties), ...(childValue as CSSProperties) };
    }
  }

  return merged;
}

export function Slot({ children, ...slotProps }: SlotProps): ReactElement {
  return cloneElement(children, mergeProps(slotProps, children.props));
}
