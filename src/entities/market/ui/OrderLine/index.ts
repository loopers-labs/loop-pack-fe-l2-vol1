import { OrderLineAmount } from './OrderLineAmount'
import { OrderLineContent } from './OrderLineContent'
import { OrderLineDescription } from './OrderLineDescription'
import { OrderLineDiscountAmount } from './OrderLineDiscountAmount'
import { OrderLineRoot } from './OrderLineRoot'
import { OrderLineStatusTag } from './OrderLineStatusTag'
import { OrderLineThumbnail } from './OrderLineThumbnail'
import { OrderLineTitle } from './OrderLineTitle'

export const OrderLine = Object.assign(
  {},
  {
    Root: OrderLineRoot,
    Thumbnail: OrderLineThumbnail,
    Content: OrderLineContent,
    Title: OrderLineTitle,
    Description: OrderLineDescription,
    Amount: OrderLineAmount,
    DiscountAmount: OrderLineDiscountAmount,
    StatusTag: OrderLineStatusTag,
  },
)
