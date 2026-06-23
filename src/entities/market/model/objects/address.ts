import type { AddressData } from '../types'

export class Address {
  readonly id: string
  readonly label: string
  readonly recipient: string
  readonly detail: string
  readonly isRemote: boolean

  constructor(data: AddressData) {
    this.id = data.id
    this.label = data.label
    this.recipient = data.recipient
    this.detail = data.detail
    this.isRemote = data.isRemote
  }
}
