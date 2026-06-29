import type { AddressDto } from '../types'

export class Address {
  readonly id: string
  readonly label: string
  readonly recipient: string
  readonly detail: string
  readonly isRemote: boolean

  constructor(addressDto: AddressDto) {
    this.id = addressDto.id
    this.label = addressDto.label
    this.recipient = addressDto.recipient
    this.detail = addressDto.detail
    this.isRemote = addressDto.isRemote
  }
}
