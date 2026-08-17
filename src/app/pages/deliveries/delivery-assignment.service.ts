import { inject, Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'

import { environment } from '../../../environments/environment'
import {
  AssignDeliveryRequest,
  DeliveryAssignmentModel,
  DeliveryStatus,
} from './delivery-assignment.model'

@Injectable({
  providedIn: 'root',
})
export class DeliveryAssignmentService {
  private httpClient = inject(HttpClient)

  private baseUrl = environment.apiUrl + 'DELIVERY-SERVICE/api/deliveries'

  assignParcelToAgent(request: AssignDeliveryRequest) {
    return this.httpClient.post<DeliveryAssignmentModel>(`${this.baseUrl}/assign`, request)
  }

  getAssignments() {
    return this.httpClient.get<DeliveryAssignmentModel[]>(this.baseUrl)
  }

  getAssignmentById(id: number) {
    return this.httpClient.get<DeliveryAssignmentModel>(`${this.baseUrl}/${id}`)
  }

  getAssignmentsByAgentId(agentId: number) {
    return this.httpClient.get<DeliveryAssignmentModel[]>(`${this.baseUrl}/agent/${agentId}`)
  }

  getAssignmentsByParcelId(parcelId: number) {
    return this.httpClient.get<DeliveryAssignmentModel[]>(`${this.baseUrl}/parcel/${parcelId}`)
  }

  getAssignmentsByStatus(status: DeliveryStatus) {
    return this.httpClient.get<DeliveryAssignmentModel[]>(`${this.baseUrl}/status/${status}`)
  }

  startDelivery(id: number) {
    return this.httpClient.patch<DeliveryAssignmentModel>(`${this.baseUrl}/${id}/start`, {})
  }

  completeDelivery(id: number) {
    return this.httpClient.patch<DeliveryAssignmentModel>(`${this.baseUrl}/${id}/complete`, {})
  }

  failDelivery(id: number, notes?: string) {
    let params = new HttpParams()

    if (notes) {
      params = params.set('notes', notes)
    }

    return this.httpClient.patch<DeliveryAssignmentModel>(
      `${this.baseUrl}/${id}/fail`,
      {},
      { params },
    )
  }

  cancelDelivery(id: number) {
    return this.httpClient.patch<DeliveryAssignmentModel>(`${this.baseUrl}/${id}/cancel`, {})
  }

  deleteAssignment(id: number) {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`)
  }

  countInProgress() {
    return this.httpClient.get<number>(`${this.baseUrl}/in-progress/count`)
  }

  countDelivered() {
    return this.httpClient.get<number>(`${this.baseUrl}/delivered/count`)
  }
}
