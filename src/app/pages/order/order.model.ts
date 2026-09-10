import { CustomerModel } from '../customer/customer.model'


export type OrderStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderModel {
  orderId: number
  customerId: number
  status: OrderStatus
  totalWeight: number
  createdAt: string
  updatedAt: string
  validatedAt?: string
  deliveryAddressId?: number
  totalParcels?: number | null
  deliveredParcels?: number | null
  cancelledParcels?: number | null
  remainingParcels?: number | null
  lockedForDelivery?: boolean | null
  lockedForDeliveryAt?: string | null
  customer?: CustomerModel
}
