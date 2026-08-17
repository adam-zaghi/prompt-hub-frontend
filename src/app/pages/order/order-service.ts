import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { OrderModel } from './order.model'
import { CreateOrderRequest } from './create-order-request.model'

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private httpClient = inject(HttpClient)

  private baseUrl = environment.apiUrl + 'ORDER-SERVICE/api/orders'

  getOrders() {
    return this.httpClient.get<OrderModel[]>(this.baseUrl)
  }

  getOrderById(id: number) {
    return this.httpClient.get<OrderModel>(`${this.baseUrl}/${id}`)
  }

  createOrder(request: CreateOrderRequest) {
    return this.httpClient.post<OrderModel>(this.baseUrl, request)
  }

  validateOrder(id: number) {
    return this.httpClient.patch<OrderModel>(`${this.baseUrl}/${id}/validate`, {})
  }

  cancelOrder(id: number) {
    return this.httpClient.patch<OrderModel>(`${this.baseUrl}/${id}/cancel`, {})
  }

  deleteOrder(id: number) {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`)
  }
  getOrdersByCustomerId(customerId: number) {
    return this.httpClient.get<OrderModel[]>(`${this.baseUrl}/customer/${customerId}`)
  }
}
