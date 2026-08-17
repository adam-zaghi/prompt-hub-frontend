export type TrackingEventType = 'POSITION_UPDATED' | 'DELAY_DETECTED'

export interface TrackingEventModel {
  id: number
  parcelId: number
  deliveryAssignmentId?: number
  deliveryAgentId?: number

  latitude: number
  longitude: number
  accuracy?: number
  speed?: number

  locationLabel?: string
  eventType: TrackingEventType
  eventTime: string
  description?: string
}

export interface DeliveryEstimateModel {
  id?: number
  parcelId: number

  remainingDistanceMeters?: number
  remainingDurationSeconds?: number

  estimatedArrival?: string

  delayInMinutes: number
  delayed: boolean

  updatedAt?: string
}

export interface UpdatePositionRequest {
  parcelId: number
  deliveryAssignmentId?: number
  deliveryAgentId?: number

  latitude: number
  longitude: number
  accuracy?: number
  speed?: number

  locationLabel?: string
  description?: string

  remainingDistanceMeters?: number
  remainingDurationSeconds?: number
}
export interface DeliveryDestinationModel {
  addressId: number
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
  latitude: number
  longitude: number
  fullAddress: string
}
