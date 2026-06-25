import type { OrderLine } from './checkoutModel'

function assertNever(value: never): never {
  throw new Error(`Unhandled order line: ${JSON.stringify(value)}`)
}

export function OrderLineRow(props: OrderLine) {
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

function LineDescription({ line }: { line: OrderLine }) {
  switch (line.kind) {
    case 'product':
      return (
        <small>
          {line.option} · 수량 {line.quantity}
        </small>
      )
    case 'coupon':
      return line.couponCode ? <small>{line.couponCode}</small> : null
    case 'subtotal':
    case 'shipping':
    case 'point':
      return null
    default:
      return assertNever(line)
  }
}
