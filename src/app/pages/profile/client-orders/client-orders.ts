import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'

import { AuthService } from '../../../auth/auth-service'
import { CustomerService } from '../../customer/customer-service'
import { CustomerModel } from '../../customer/customer.model'
import { AddressModel } from '../../customer/address.model'
import { OrderService } from '../../order/order-service'
import { OrderModel } from '../../order/order.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './client-orders.html',
  styleUrl: './client-orders.scss',
})
export class ClientOrders implements OnInit {
  private authService = inject(AuthService)
  private customerService = inject(CustomerService)
  private orderService = inject(OrderService)

  loading = signal(false)
  errorMessage = signal('')

  customer = signal<CustomerModel | null>(null)
  orders = signal<OrderModel[]>([])

  user = computed(() => this.authService.currentUser())

  totalOrders = computed(() => this.orders().length)

  validatedOrders = computed(
    () => this.orders().filter((order) => order.status === 'VALIDATED').length,
  )

  inDeliveryOrders = computed(
    () => this.orders().filter((order) => order.status === 'IN_DELIVERY').length,
  )

  deliveredOrders = computed(
    () => this.orders().filter((order) => order.status === 'DELIVERED').length,
  )

  ngOnInit(): void {
    this.loadPage()
  }

  loadPage(): void {
    this.loading.set(true)
    this.errorMessage.set('')

    const currentUser = this.user()

    if (currentUser?.userId) {
      this.loadCustomerAndOrders(currentUser.userId)
      return
    }

    this.authService.loadCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          this.loading.set(false)
          this.errorMessage.set('Utilisateur connecté introuvable.')
          return
        }

        this.loadCustomerAndOrders(user.userId)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger l’utilisateur connecté.')
      },
    })
  }

  private loadCustomerAndOrders(userId: number): void {
    this.customerService.getCustomerByUserId(userId).subscribe({
      next: (customer) => {
        if (!customer?.id) {
          this.loading.set(false)
          this.errorMessage.set('Aucun profil client trouvé pour ce compte.')
          return
        }

        this.customer.set(customer)
        this.loadOrders(customer.id)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger le profil client.',
        )
      },
    })
  }

  private loadOrders(customerId: number): void {
    this.orderService.getOrdersByCustomerId(customerId).subscribe({
      next: (orders) => {
        this.orders.set(orders ?? [])
        this.loading.set(false)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger vos commandes.',
        )
      },
    })
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'DRAFT':
        return 'En préparation'
      case 'VALIDATED':
        return 'Validée'
      case 'IN_DELIVERY':
        return 'En livraison'
      case 'DELIVERED':
        return 'Livrée'
      case 'CANCELLED':
        return 'Annulée'
      default:
        return status || '-'
    }
  }

  getStatusSeverity(status?: string): TagSeverity {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'VALIDATED':
        return 'info'
      case 'IN_DELIVERY':
        return 'warn'
      case 'DELIVERED':
        return 'success'
      case 'CANCELLED':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  getDeliveryAddressLine(order: OrderModel): string {
    const addressId = order.deliveryAddressId
    const addresses = this.customer()?.addresses ?? []

    if (!addressId) {
      return 'Adresse non définie'
    }

    const address = addresses.find((item) => item.id === addressId)

    if (!address) {
      return `Adresse #${addressId}`
    }

    return this.formatAddress(address)
  }

  private formatAddress(address: AddressModel): string {
    return [address.street, address.city, address.state, address.postalCode, address.country]
      .filter(Boolean)
      .join(', ')
  }
}
