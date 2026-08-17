export interface UpdateAddressRequest {
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
  latitude: number
  longitude: number
}
