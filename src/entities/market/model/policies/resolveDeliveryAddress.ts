import { NoDeliveryAddressConfiguredError } from '../errors'
import type { Address } from '../objects'

export function resolveDeliveryAddress(
  addresses: ReadonlyArray<Address>,
  selectedAddressId: string,
) {
  const resolvedAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses.at(0)

  if (!resolvedAddress) {
    throw new NoDeliveryAddressConfiguredError()
  }

  return resolvedAddress
}
