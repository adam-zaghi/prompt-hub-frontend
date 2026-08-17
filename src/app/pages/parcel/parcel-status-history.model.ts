import { ParcelStatus } from './parcel.model'

export interface ParcelStatusHistoryModel {
  id: number
  oldStatus?: ParcelStatus
  newStatus: ParcelStatus
  comment: string
  changedAt: string
  changedBy?: number
}
