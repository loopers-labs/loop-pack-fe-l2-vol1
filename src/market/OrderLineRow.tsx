import type { OrderLine } from './checkoutModel'

function assertNever(value: never): never {
  throw new Error(`Unhandled order line kind: ${JSON.stringify(value)}`)
}

function LineDescription({
  line,
}: {
  line: OrderLine
}): React.ReactElement | null {
  switch (line.kind) {
    case 'product':
      return (
        <small>
          {line.option} · 수량 {line.quantity}
        </small>
      )
    case 'coupon':
      return <small>{line.couponCode}</small>
    case 'subtotal':
    case 'shipping':
    case 'point':
      return null
    default:
      return assertNever(line)
  }
}

export function OrderLineRow(props: OrderLine): React.ReactElement {
  const isDiscount = props.kind === 'coupon' || props.kind === 'point'
  return (
    <div className="line">
      {props.kind === 'product' ? (
        <span className="thumb">{props.thumbnail}</span>
      ) : null}
      <div className="grow">
        <span>{props.label}</span>
        <LineDescription line={props} />
      </div>
      <strong style={{ color: isDiscount ? '#ef4444' : 'var(--text-h)' }}>
        {isDiscount ? '- ' : ''}
        {props.amount.toLocaleString()}원
      </strong>
    </div>
  )
}
