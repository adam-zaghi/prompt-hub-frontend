import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { ParcelModel, ParcelStatus } from './parcel.model'
import { CreateParcelRequest } from './create-parcel-request.model'
import { ParcelStatusHistoryModel } from './parcel-status-history.model'

@Injectable({
  providedIn: 'root',
})
export class ParcelService {
  private httpClient = inject(HttpClient)

  private baseUrl = environment.apiUrl + 'PARCEL-SERVICE/api/parcels'

  getParcels() {
    return this.httpClient.get<ParcelModel[]>(this.baseUrl)
  }

  getParcelById(id: number) {
    return this.httpClient.get<ParcelModel>(`${this.baseUrl}/${id}`)
  }

  getParcelsByOrderId(orderId: number) {
    return this.httpClient.get<ParcelModel[]>(`${this.baseUrl}/order/${orderId}`)
  }

  createParcel(request: CreateParcelRequest) {
    return this.httpClient.post<ParcelModel>(this.baseUrl, request)
  }

  updateParcelStatus(id: number, status: ParcelStatus, comment: string) {
    return this.httpClient.patch<ParcelModel>(`${this.baseUrl}/${id}/status`, {
      status,
      changedBy: null,
      comment,
    })
  }

  getParcelHistory(id: number) {
    return this.httpClient.get<ParcelStatusHistoryModel[]>(`${this.baseUrl}/${id}/history`)
  }

  deleteParcel(id: number) {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`)
  }
}
