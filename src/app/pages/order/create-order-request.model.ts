export interface CreateOrderRequest {
  customerId: number
  totalWeight: number
  deliveryAddressId?: number
}
