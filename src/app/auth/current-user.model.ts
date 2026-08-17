export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  enabled: boolean
}

export interface CurrentUser {
  userId: number
  email: string
  role: string
}
