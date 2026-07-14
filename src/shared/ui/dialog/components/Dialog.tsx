import { DialogClose } from './DialogClose'
import { DialogContent } from './DialogContent'
import { DialogDescription } from './DialogDescription'
import { DialogOverlay } from './DialogOverlay'
import { DialogRoot } from './DialogRoot'
import { DialogTitle } from './DialogTitle'
import { DialogTrigger } from './DialogTrigger'

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
})
