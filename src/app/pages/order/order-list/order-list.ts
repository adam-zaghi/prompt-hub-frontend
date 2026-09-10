import { AsyncPipe, DatePipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'

import { TableModule } from 'primeng/table'
import { Button } from 'primeng/button'
import { Tag } from 'primeng/tag'
import { InputText } from 'primeng/inputtext'
import { Tooltip } from 'primeng/tooltip'

import { OrderService } from '../order-service'
import { OrderModel, OrderStatus } from '../order.model'

@Component({
  selector: 'app-order-list',
  imports: [TableModule, Button, Tag, AsyncPipe, DatePipe, RouterLink, InputText, Tooltip],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService)

  orders$!: Observable<OrderModel[]>

  ngOnInit() {
    this.loadOrders()
  }

  loadOrders() {
    this.orders$ = this.orderService.getOrders()
  }

  validateOrder(orderId: number) {
    this.orderService.validateOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur validation commande', err),
    })
  }

  cancelOrder(orderId: number) {
    const confirmed = confirm('Voulez-vous vraiment annuler cette commande ?')

    if (!confirmed) return

    this.orderService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur annulation commande', err),
    })
  }

  deleteOrder(orderId: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer cette commande ?')

    if (!confirmed) return

    this.orderService.deleteOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur suppression commande', err),
    })
  }

  getSeverity(status: OrderStatus) {
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

  getStatusLabel(status: OrderStatus): string {
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

  getOrderSubtitle(status: OrderStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'En attente de validation'
      case 'VALIDATED':
        return 'Prête pour les colis'
      case 'IN_DELIVERY':
        return 'Livraison en cours'
      case 'DELIVERED':
        return 'Commande terminée'
      case 'CANCELLED':
        return 'Commande annulée'
      default:
        return 'Commande logistique'
    }
  }

  getCustomerName(order: OrderModel) {
    if (!order.customer) {
      return `Client #${order.customerId}`
    }

    return `${order.customer.firstName} ${order.customer.lastName}`
  }
}
