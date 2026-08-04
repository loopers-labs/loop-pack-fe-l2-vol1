import { createSafeContext } from "../internal/create-safe-context";

export interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const [DialogContext, useDialogContext] = createSafeContext<DialogContextValue>("Dialog");
