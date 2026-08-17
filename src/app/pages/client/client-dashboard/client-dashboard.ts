import { CommonModule } from '@angular/common'
import { Component, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { forkJoin, of } from 'rxjs'
import { catchError, finalize, map, switchMap } from 'rxjs/operators'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { SkeletonModule } from 'primeng/skeleton'


import { DashboardStatCard } from './components/dashboard-stat-card/dashboard-stat-card'
import { ClientActiveDeliveryCard } from './components/client-active-delivery-card/client-active-delivery-card'
import { ClientAddressCard } from './components/client-address-card/client-address-card'
import { ClientAlertsCard } from './components/client-alerts-card/client-alerts-card'
import { OrderModel } from '../../order/order.model'
import { ParcelModel } from '../../parcel/parcel.model'
import { AddressModel } from '../../customer/address.model'
import { TrackingService } from '../../tracking/tracking.service'
import { ParcelService } from '../../parcel/parcel.service'
import { OrderService } from '../../order/order-service'
import { CustomerService } from '../../customer/customer-service'
import { AuthService } from '../../../auth/auth-service'
import { DeliveryEstimateModel } from '../../tracking/tracking.model'

interface ClientDashboardStats {
  totalOrders: number
  activeOrders: number
  validatedOrders: number
  deliveredOrders: number
  cancelledOrders: number

  totalParcels: number
  createdParcels: number
  readyParcels: number
  outForDeliveryParcels: number
  deliveredParcels: number
  problemParcels: number
}

interface ActiveDeliveryView {
  parcel: ParcelModel
  estimate?: DeliveryEstimateModel | null
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    SkeletonModule,
    DashboardStatCard,
    ClientActiveDeliveryCard,
    ClientAddressCard,
    ClientAlertsCard,
  ],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss',
})
export class ClientDashboard implements OnInit {
  private authService = inject(AuthService)
  private customerService = inject(CustomerService)
  private orderService = inject(OrderService)
  private parcelService = inject(ParcelService)
  private trackingService = inject(TrackingService)

  loading = signal(false)
  errorMessage = signal<string | null>(null)

  customerId = signal<number | null>(null)
  customerFullName = signal<string>('')
  customerEmail = signal<string>('')

  orders = signal<OrderModel[]>([])
  parcels = signal<ParcelModel[]>([])
  defaultAddress = signal<AddressModel | null>(null)
  activeDelivery = signal<ActiveDeliveryView | null>(null)
  delayedCount = signal(0)

  stats = signal<ClientDashboardStats>({
    totalOrders: 0,
    activeOrders: 0,
    validatedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,

    totalParcels: 0,
    createdParcels: 0,
    readyParcels: 0,
    outForDeliveryParcels: 0,
    deliveredParcels: 0,
    problemParcels: 0,
  })

  ngOnInit(): void {
    this.loadDashboard()
  }

  loadDashboard(): void {
    this.loading.set(true)
    this.errorMessage.set(null)

    const currentUser = this.authService.currentUser()

    if (!currentUser?.userId) {
      this.loading.set(false)
      this.errorMessage.set('Utilisateur connecté introuvable.')
      return
    }

    this.customerService
      .getCustomerByUserId(currentUser.userId)
      .pipe(
        switchMap((customer) => {
          this.customerId.set(customer.id)
          this.customerFullName.set(`${customer.firstName} ${customer.lastName}`)
          this.customerEmail.set(customer.email)

          const defaultAddress =
            customer.addresses?.find((address: AddressModel) => address.isDefault) ?? null

          this.defaultAddress.set(defaultAddress)

          return this.orderService.getOrdersByCustomerId(customer.id)
        }),

        switchMap((orders) => {
          this.orders.set(orders)

          if (orders.length === 0) {
            return of({
              orders,
              parcels: [] as ParcelModel[],
            })
          }

          return forkJoin(
            orders.map((order) =>
              this.parcelService
                .getParcelsByOrderId(order.orderId)
                .pipe(catchError(() => of([] as ParcelModel[]))),
            ),
          ).pipe(
            map((parcelGroups) => ({
              orders,
              parcels: parcelGroups.flat(),
            })),
          )
        }),

        switchMap(({ orders, parcels }) => {
          this.parcels.set(parcels)
          this.stats.set(this.calculateStats(orders, parcels))

          const activeParcel =
            parcels.find((parcel) => parcel.status === 'OUT_FOR_DELIVERY') ?? null

          if (!activeParcel) {
            this.activeDelivery.set(null)
            this.delayedCount.set(0)
            return of(null)
          }

          return this.trackingService.getParcelEstimate(activeParcel.id).pipe(
            catchError(() => of(null)),
            map((estimate) => {
              this.activeDelivery.set({
                parcel: activeParcel,
                estimate,
              })

              this.delayedCount.set(estimate?.delayed ? 1 : 0)

              return estimate
            }),
          )
        }),

        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        error: (err) => {
          console.error(err)
          this.errorMessage.set(
            err?.error?.message || err?.error || 'Impossible de charger le tableau de bord client.',
          )
        },
      })
  }

  private calculateStats(orders: OrderModel[], parcels: ParcelModel[]): ClientDashboardStats {
    return {
      totalOrders: orders.length,

      activeOrders: orders.filter((order) =>
        ['DRAFT', 'VALIDATED', 'IN_DELIVERY'].includes(order.status),
      ).length,

      validatedOrders: orders.filter((order) => order.status === 'VALIDATED').length,

      deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,

      cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,

      totalParcels: parcels.length,

      createdParcels: parcels.filter((parcel) => parcel.status === 'CREATED').length,

      readyParcels: parcels.filter((parcel) => parcel.status === 'READY_TO_SHIP').length,

      outForDeliveryParcels: parcels.filter((parcel) => parcel.status === 'OUT_FOR_DELIVERY')
        .length,

      deliveredParcels: parcels.filter((parcel) => parcel.status === 'DELIVERED').length,

      problemParcels: parcels.filter((parcel) => ['CANCELLED', 'RETURNED'].includes(parcel.status))
        .length,
    }
  }
}
