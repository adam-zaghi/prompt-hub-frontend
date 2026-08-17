import { ParcelModel } from '../parcel/parcel.model'
import { DeliveryEstimateModel } from '../tracking/tracking.model'
import { OrderModel } from '../order/order.model'
import { AddressModel } from '../customer/address.model'


export interface ClientDashboardStats {
  totalOrders: number
  activeOrders: number
  validatedOrders: number
  deliveredOrders: number
  cancelledOrders: number

  totalParcels: number
  createdParcels: number
  readyParcels: number
  outForDeliveryParcels: number
  deliveredParcels: number
  problemParcels: number
}

export interface ActiveDeliveryView {
  parcel: ParcelModel
  estimate?: DeliveryEstimateModel | null
}

export interface ClientDashboardData {
  customerId: number
  customerFullName: string
  customerEmail: string
  orders: OrderModel[]
  parcels: ParcelModel[]
  stats: ClientDashboardStats
  activeDelivery?: ActiveDeliveryView | null
  defaultAddress?: AddressModel | null
  delayedCount: number
}
