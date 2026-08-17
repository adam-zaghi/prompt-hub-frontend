import { AddressModel } from './address.model'

export interface CreateCustomerRequest {
  userEmail: string
  defaultAddress: AddressModel
}
