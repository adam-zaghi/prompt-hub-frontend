import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import {
  DeliveryDestinationModel,
  DeliveryEstimateModel,
  TrackingEventModel,
  UpdatePositionRequest,
} from './tracking.model'

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private http = inject(HttpClient)
  private baseUrl = environment.apiUrl + 'TRACKING-SERVICE/api/tracking'

  updatePosition(request: UpdatePositionRequest) {
    return this.http.post<TrackingEventModel>(`${this.baseUrl}/positions`, request)
  }
  getParcelDestination(parcelId: number) {
    return this.http.get<DeliveryDestinationModel>(
      `${this.baseUrl}/parcels/${parcelId}/destination`,
    )
  }
  getParcelHistory(parcelId: number) {
    return this.http.get<TrackingEventModel[]>(`${this.baseUrl}/parcels/${parcelId}/history`)
  }

  getLastPosition(parcelId: number) {
    return this.http.get<TrackingEventModel>(`${this.baseUrl}/parcels/${parcelId}/last-position`)
  }

  getParcelEstimate(parcelId: number) {
    return this.http.get<DeliveryEstimateModel>(`${this.baseUrl}/parcels/${parcelId}/estimate`)
  }

}
