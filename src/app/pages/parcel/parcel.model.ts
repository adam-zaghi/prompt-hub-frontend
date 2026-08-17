import { OrderModel } from '../order/order.model'

export type ParcelStatus =
  | 'CREATED'
  | 'PREPARING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'

export type ParcelPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface ParcelModel {
  id: number
  orderId: number

  weight: number
  height: number
  width: number
  length: number

  fragile: boolean
  insured: boolean

  status: ParcelStatus
  priority: ParcelPriority

  estimatedDelivery?: string
  createdAt: string
  updatedAt: string

  order?:OrderModel
}
