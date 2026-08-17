import { DeliveryAgentModel } from '../delivery-agents/delivery-agent.model'
import { ParcelModel } from '../parcel/parcel.model'

export type DeliveryStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'DELIVERED' | 'FAILED' | 'CANCELLED'

export interface DeliveryAssignmentModel {
  id: number
  parcelId: number

  agent: DeliveryAgentModel

  status: DeliveryStatus

  assignedAt: string
  startedAt?: string
  completedAt?: string

  notes?: string

  parcel?: ParcelModel

}

export interface AssignDeliveryRequest {
  parcelId: number
  agentId: number
  notes?: string
}
