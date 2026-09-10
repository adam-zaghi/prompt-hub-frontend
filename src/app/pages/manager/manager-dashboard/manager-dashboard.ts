import { CommonModule } from '@angular/common'
import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { forkJoin, of } from 'rxjs'
import { catchError, finalize } from 'rxjs/operators'

import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'

import { environment } from '../../../../environments/environment'

type OrderStatus = 'DRAFT' | 'VALIDATED' | 'IN_DELIVERY' | 'DELIVERED' | 'CANCELLED'
type ParcelStatus =
  | 'CREATED'
  | 'READY_TO_SHIP'
  | 'OUT_FOR_DELIVERY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'

type DeliveryStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

interface CustomerModel {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface OrderModel {
  orderId: number
  customerId: number
  status: OrderStatus
  totalWeight: number
  createdAt: string
  validatedAt?: string | null
  customer?: {
    firstName: string
    lastName: string
  }
}

interface ParcelModel {
  id: number
  orderId: number
  status: ParcelStatus
  priority: string
  weight: number
  estimatedDelivery?: string | null
}

interface DeliveryAgentModel {
  id: number
  firstName: string
  lastName: string
  available: boolean
  currentCity?: string
}

interface DeliveryAssignmentModel {
  id: number
  parcelId: number
  status: DeliveryStatus
  assignedAt: string
  startedAt?: string | null
  completedAt?: string | null
  agent?: DeliveryAgentModel
}

@Component({
  selector: 'app-manager-dashboard',
  imports: [CommonModule, RouterLink, ButtonModule, TagModule],
  templateUrl: './manager-dashboard.html',
  styleUrl: './manager-dashboard.scss',
})
export class ManagerDashboardComponent implements OnInit {
  private http = inject(HttpClient)
  private readonly apiUrl = environment.apiUrl

  loading = signal(false)

  customers = signal<CustomerModel[]>([])
  orders = signal<OrderModel[]>([])
  parcels = signal<ParcelModel[]>([])
  agents = signal<DeliveryAgentModel[]>([])
  assignments = signal<DeliveryAssignmentModel[]>([])

  stats = computed(() => {
    const orders = this.orders()
    const parcels = this.parcels()
    const agents = this.agents()
    const assignments = this.assignments()

    return {
      customers: this.customers().length,
      orders: orders.length,
      parcels: parcels.length,
      availableAgents: agents.filter((agent) => agent.available).length,
      activeDeliveries: assignments.filter((item) => item.status === 'IN_PROGRESS').length,
      deliveredParcels: parcels.filter((parcel) => parcel.status === 'DELIVERED').length,
      pendingOrders: orders.filter(
        (order) => order.status === 'DRAFT' || order.status === 'VALIDATED',
      ).length,
      cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
    }
  })

  kpiCards = computed(() => [
    {
      label: 'Clients',
      value: this.stats().customers,
      icon: 'pi pi-users',
      subtitle: 'Clients enregistrés',
      route: '/customers',
    },
    {
      label: 'Commandes',
      value: this.stats().orders,
      icon: 'pi pi-shopping-cart',
      subtitle: 'Commandes logistiques',
      route: '/orders',
    },
    {
      label: 'Colis',
      value: this.stats().parcels,
      icon: 'pi pi-box',
      subtitle: 'Colis enregistrés',
      route: '/parcels',
    },
    {
      label: 'Livreurs disponibles',
      value: this.stats().availableAgents,
      icon: 'pi pi-truck',
      subtitle: 'Livreurs prêts',
      route: '/delivery-agents',
    },
    {
      label: 'Livraisons en cours',
      value: this.stats().activeDeliveries,
      icon: 'pi pi-send',
      subtitle: 'Affectations actives',
      route: '/deliveries',
    },
    {
      label: 'Colis livrés',
      value: this.stats().deliveredParcels,
      icon: 'pi pi-check-circle',
      subtitle: 'Livraisons terminées',
      route: '/parcels',
    },
  ])

  orderStatusItems = computed(() => {
    const orders = this.orders()
    const total = orders.length || 1

    return [
      {
        label: 'Brouillon',
        status: 'DRAFT' as OrderStatus,
        value: this.countByStatus(orders, 'DRAFT'),
      },
      {
        label: 'Validées',
        status: 'VALIDATED' as OrderStatus,
        value: this.countByStatus(orders, 'VALIDATED'),
      },
      {
        label: 'En livraison',
        status: 'IN_DELIVERY' as OrderStatus,
        value: this.countByStatus(orders, 'IN_DELIVERY'),
      },
      {
        label: 'Livrées',
        status: 'DELIVERED' as OrderStatus,
        value: this.countByStatus(orders, 'DELIVERED'),
      },
      {
        label: 'Annulées',
        status: 'CANCELLED' as OrderStatus,
        value: this.countByStatus(orders, 'CANCELLED'),
      },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }))
  })

  recentOrders = computed(() => {
    return [...this.orders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  })

  activeAssignments = computed(() => {
    return this.assignments()
      .filter((item) => item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS')
      .slice(0, 5)
  })

  ngOnInit(): void {
    this.loadDashboard()
  }

  loadDashboard(): void {
    this.loading.set(true)

    forkJoin({
      customers: this.getArray<CustomerModel>('CUSTOMER-SERVICE/api/customers'),
      orders: this.getArray<OrderModel>('ORDER-SERVICE/api/orders'),
      parcels: this.getArray<ParcelModel>('PARCEL-SERVICE/api/parcels'),
      agents: this.getArray<DeliveryAgentModel>('DELIVERY-SERVICE/api/delivery-agents'),
      assignments: this.getArray<DeliveryAssignmentModel>('DELIVERY-SERVICE/api/deliveries'),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => {
        this.customers.set(data.customers)
        this.orders.set(data.orders)
        this.parcels.set(data.parcels)
        this.agents.set(data.agents)
        this.assignments.set(data.assignments)
      })
  }

  private getArray<T>(url: string) {
    return this.http.get<T[]>(`${this.apiUrl}${url}`).pipe(
      catchError((err) => {
        console.error(`Erreur chargement ${url}`, err)
        return of([] as T[])
      }),
    )
  }

  private countByStatus<T extends { status: string }>(items: T[], status: string): number {
    return items.filter((item) => item.status === status).length
  }

  getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon'
      case 'VALIDATED':
        return 'Validée'
      case 'IN_DELIVERY':
        return 'En livraison'
      case 'DELIVERED':
        return 'Livrée'
      case 'CANCELLED':
        return 'Annulée'
      default:
        return status
    }
  }

  getDeliveryStatusLabel(status: DeliveryStatus): string {
    switch (status) {
      case 'ASSIGNED':
        return 'Affectée'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'DELIVERED':
        return 'Livrée'
      case 'FAILED':
        return 'Échouée'
      case 'CANCELLED':
        return 'Annulée'
      default:
        return status
    }
  }

  getOrderSeverity(status: OrderStatus): TagSeverity {
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

  getDeliverySeverity(status: DeliveryStatus): TagSeverity {
    switch (status) {
      case 'ASSIGNED':
        return 'info'
      case 'IN_PROGRESS':
        return 'warn'
      case 'DELIVERED':
        return 'success'
      case 'FAILED':
      case 'CANCELLED':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  getCustomerName(order: OrderModel): string {
    if (!order.customer) {
      return `Client #${order.customerId}`
    }

    return `${order.customer.firstName} ${order.customer.lastName}`
  }

  getAgentName(assignment: DeliveryAssignmentModel): string {
    if (!assignment.agent) return 'Livreur non défini'
    return `${assignment.agent.firstName} ${assignment.agent.lastName}`
  }
}
