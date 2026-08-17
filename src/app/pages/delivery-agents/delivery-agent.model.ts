export interface DeliveryAgentModel {
  id: number
  userId: number | null

  firstName: string
  lastName: string
  phone: string
  email: string

  available: boolean
  currentCity: string

  createdAt?: string
  updatedAt?: string
}

export interface CreateDeliveryAgentRequest {
  userEmail: string
  currentCity: string
  available: boolean
}
