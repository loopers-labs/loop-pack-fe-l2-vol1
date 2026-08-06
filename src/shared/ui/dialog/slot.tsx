"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
  SyntheticEvent,
} from "react";
import { cloneElement, isValidElement } from "react";

type SlotProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

type SlottableElementProps = {
  className?: string;
  style?: CSSProperties;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export function composeEventHandlers<Event extends SyntheticEvent>(
  userHandler: ((event: Event) => void) | undefined,
  internalHandler: ((event: Event) => void) | undefined,
) {
  return (event: Event) => {
    userHandler?.(event);

    if (event.defaultPrevented) {
      return;
    }

    internalHandler?.(event);
  };
}

export function Slot({ children, className, style, onClick, ...slotProps }: SlotProps) {
  if (!isValidElement<SlottableElementProps>(children)) {
    throw new Error("asChild expects a single valid React element");
  }

  return cloneElement(children as ReactElement<SlottableElementProps>, {
    ...slotProps,
    ...children.props,
    className: mergeClassName(className, children.props.className),
    style: mergeStyle(style, children.props.style),
    onClick: composeEventHandlers(children.props.onClick, onClick),
  });
}

function mergeClassName(slotClassName: string | undefined, childClassName: string | undefined) {
  return [slotClassName, childClassName].filter(Boolean).join(" ") || undefined;
}

function mergeStyle(slotStyle: CSSProperties | undefined, childStyle: CSSProperties | undefined) {
  return {
    ...slotStyle,
    ...childStyle,
  };
}
