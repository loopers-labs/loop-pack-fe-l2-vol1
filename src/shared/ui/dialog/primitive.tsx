"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Slot } from "./slot";

type PrimitiveProps = {
  asChild?: boolean;
  children?: ReactNode;
};

type PrimitiveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & PrimitiveProps;
type PrimitiveDivProps = HTMLAttributes<HTMLDivElement> & PrimitiveProps;
type PrimitiveHeadingProps = HTMLAttributes<HTMLHeadingElement> & PrimitiveProps;
type PrimitiveParagraphProps = HTMLAttributes<HTMLParagraphElement> & PrimitiveProps;

function PrimitiveButton({ asChild, children, ...props }: PrimitiveButtonProps) {
  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <button {...props}>{children}</button>;
}

function PrimitiveDiv({ asChild, children, ...props }: PrimitiveDivProps) {
  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <div {...props}>{children}</div>;
}

function PrimitiveHeading({ asChild, children, ...props }: PrimitiveHeadingProps) {
  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <h2 {...props}>{children}</h2>;
}

function PrimitiveParagraph({ asChild, children, ...props }: PrimitiveParagraphProps) {
  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }

  return <p {...props}>{children}</p>;
}

export const Primitive = {
  button: PrimitiveButton,
  div: PrimitiveDiv,
  h2: PrimitiveHeading,
  p: PrimitiveParagraph,
};
