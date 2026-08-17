import { CustomerModel } from '../customer/customer.model'


export type OrderStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderModel {
  orderId: number;
  customerId: number;
  status: OrderStatus;
  totalWeight: number;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  deliveryAddressId?: number;
  customer?: CustomerModel;
}
