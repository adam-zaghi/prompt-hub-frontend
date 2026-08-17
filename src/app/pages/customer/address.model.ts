export interface AddressModel {
  id?: number
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
  isDefault: boolean
  latitude:number
  longitude:number
  userId?:number
}
