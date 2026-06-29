export class NoDeliveryAddressConfiguredError extends Error {
  constructor() {
    super('No delivery address configured')
    this.name = 'NoDeliveryAddressConfiguredError'
    Object.setPrototypeOf(this, NoDeliveryAddressConfiguredError.prototype)
  }
}
