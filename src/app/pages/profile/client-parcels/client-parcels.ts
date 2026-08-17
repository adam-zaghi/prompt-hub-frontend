import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { forkJoin, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'

import { AuthService } from '../../../auth/auth-service'
import { CustomerService } from '../../customer/customer-service'
import { CustomerModel } from '../../customer/customer.model'
import { OrderService } from '../../order/order-service'
import { OrderModel } from '../../order/order.model'
import { ParcelService } from '../../parcel/parcel.service'
import { ParcelModel } from '../../parcel/parcel.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

interface ClientParcelRow {
  parcel: ParcelModel
  order: OrderModel
}

@Component({
  selector: 'app-client-parcels',
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
  templateUrl: './client-parcels.html',
  styleUrl: './client-parcels.scss',
})
export class ClientParcels implements OnInit {
  private authService = inject(AuthService)
  private customerService = inject(CustomerService)
  private orderService = inject(OrderService)
  private parcelService = inject(ParcelService)
  private route = inject(ActivatedRoute)

  loading = signal(false)
  errorMessage = signal('')

  customer = signal<CustomerModel | null>(null)
  orders = signal<OrderModel[]>([])
  parcelRows = signal<ClientParcelRow[]>([])

  selectedOrderId = signal<number | null>(null)

  user = computed(() => this.authService.currentUser())

  totalParcels = computed(() => this.parcelRows().length)

  preparingParcels = computed(
    () =>
      this.parcelRows().filter((row) =>
        ['CREATED', 'PREPARING', 'READY_TO_SHIP'].includes(row.parcel.status),
      ).length,
  )

  outForDeliveryParcels = computed(
    () =>
      this.parcelRows().filter((row) =>
        ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'SHIPPED'].includes(row.parcel.status),
      ).length,
  )

  deliveredParcels = computed(
    () => this.parcelRows().filter((row) => row.parcel.status === 'DELIVERED').length,
  )

  ngOnInit(): void {
    const orderIdParam = this.route.snapshot.queryParamMap.get('orderId')

    if (orderIdParam) {
      this.selectedOrderId.set(Number(orderIdParam))
    }

    this.loadPage()
  }

  loadPage(): void {
    this.loading.set(true)
    this.errorMessage.set('')

    const currentUser = this.user()

    if (currentUser?.userId) {
      this.loadCustomerAndData(currentUser.userId)
      return
    }

    this.authService.loadCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          this.loading.set(false)
          this.errorMessage.set('Utilisateur connecté introuvable.')
          return
        }

        this.loadCustomerAndData(user.userId)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger l’utilisateur connecté.')
      },
    })
  }

  private loadCustomerAndData(userId: number): void {
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
        const clientOrders = orders ?? []

        this.orders.set(clientOrders)

        const selectedOrderId = this.selectedOrderId()

        const ordersToLoad = selectedOrderId
          ? clientOrders.filter((order) => order.orderId === selectedOrderId)
          : clientOrders

        if (ordersToLoad.length === 0) {
          this.parcelRows.set([])
          this.loading.set(false)
          return
        }

        this.loadParcelsForOrders(ordersToLoad)
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

  private loadParcelsForOrders(orders: OrderModel[]): void {
    const requests = orders.map((order) =>
      this.parcelService.getParcelsByOrderId(order.orderId).pipe(
        map((parcels) =>
          (parcels ?? []).map((parcel) => ({
            parcel,
            order,
          })),
        ),
        catchError((err) => {
          console.error('Erreur chargement colis order', order.orderId, err)
          return of([])
        }),
      ),
    )

    forkJoin(requests).subscribe({
      next: (results) => {
        const rows = results.flat()

        this.parcelRows.set(rows)
        this.loading.set(false)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger vos colis.')
      },
    })
  }

  clearOrderFilter(): void {
    this.selectedOrderId.set(null)
    this.loadPage()
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'CREATED':
        return 'Créé'
      case 'PREPARING':
        return 'En préparation'
      case 'READY_TO_SHIP':
        return 'Prêt à expédier'
      case 'SHIPPED':
        return 'Expédié'
      case 'IN_TRANSIT':
        return 'En transit'
      case 'OUT_FOR_DELIVERY':
        return 'En cours de livraison'
      case 'DELIVERED':
        return 'Livré'
      case 'RETURNED':
        return 'Retourné'
      case 'CANCELLED':
        return 'Annulé'
      default:
        return status || '-'
    }
  }

  getStatusSeverity(status?: string): TagSeverity {
    switch (status) {
      case 'CREATED':
      case 'PREPARING':
        return 'secondary'
      case 'READY_TO_SHIP':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'info'
      case 'OUT_FOR_DELIVERY':
        return 'warn'
      case 'DELIVERED':
        return 'success'
      case 'RETURNED':
      case 'CANCELLED':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  getPrioritySeverity(priority?: string): TagSeverity {
    switch (priority) {
      case 'URGENT':
        return 'danger'
      case 'HIGH':
        return 'warn'
      case 'NORMAL':
        return 'info'
      case 'LOW':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  canTrackLive(parcel: ParcelModel): boolean {
    return parcel.status === 'OUT_FOR_DELIVERY'
  }

  canViewTrackingHistory(parcel: ParcelModel): boolean {
    return parcel.status === 'DELIVERED'
  }

  isTrackingUnavailable(parcel: ParcelModel): boolean {
    return !this.canTrackLive(parcel) && !this.canViewTrackingHistory(parcel)
  }
}
