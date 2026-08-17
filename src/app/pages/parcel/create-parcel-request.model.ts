import { ParcelPriority } from './parcel.model'

export interface CreateParcelRequest {
  orderId: number

  weight: number
  height: number
  width: number
  length: number

  fragile: boolean
  insured: boolean

  priority: ParcelPriority

}
