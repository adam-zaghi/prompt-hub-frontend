import { AddressModel } from './address.model'

export interface CustomerModel {
  id: number
  userId: number
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: string
  updatedAt: string
  addresses: AddressModel[]
}
