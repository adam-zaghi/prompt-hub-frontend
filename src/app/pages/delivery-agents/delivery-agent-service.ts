import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CreateDeliveryAgentRequest, DeliveryAgentModel } from './delivery-agent.model'
import { environment } from '../../../environments/environment'

@Injectable({
  providedIn: 'root',
})
export class DeliveryAgentService {
  private httpClient = inject(HttpClient)

  private baseUrl = environment.apiUrl + 'DELIVERY-SERVICE/api/delivery-agents'

  getAgents() {
    return this.httpClient.get<DeliveryAgentModel[]>(this.baseUrl)
  }

  getAvailableAgents() {
    return this.httpClient.get<DeliveryAgentModel[]>(`${this.baseUrl}/available`)
  }

  getAgentById(id: number) {
    return this.httpClient.get<DeliveryAgentModel>(`${this.baseUrl}/${id}`)
  }

  createAgent(request: CreateDeliveryAgentRequest) {
    return this.httpClient.post<DeliveryAgentModel>(this.baseUrl, request)
  }

  deleteAgent(id: number) {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`)
  }

  countAgents() {
    return this.httpClient.get<number>(`${this.baseUrl}/count`)
  }

  countAvailableAgents() {
    return this.httpClient.get<number>(`${this.baseUrl}/count/available`)
  }
  getAgentByUserId(userId: number) {
    return this.httpClient.get<DeliveryAgentModel>(`${this.baseUrl}/by-user/${userId}`)
  }
}
