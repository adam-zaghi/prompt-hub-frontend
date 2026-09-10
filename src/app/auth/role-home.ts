export function getHomeUrlByRole(role?: string | null): string | null {
  if (!role) return null

  switch (role) {
    case 'CUSTOMER':
      return '/client/profile'

    case 'DELIVERY_AGENT':
      return '/driver/dashboard'

    case 'ADMIN':
    case 'LOGISTICS_MANAGER':
      return '/customers'

    default:
      return null
  }
}
