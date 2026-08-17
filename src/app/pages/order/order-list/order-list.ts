import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

import { OrderService } from '../order-service';
import { OrderModel, OrderStatus } from '../order.model';

@Component({
  selector: 'app-order-list',
  imports: [TableModule, Button, Tag, AsyncPipe, DatePipe, RouterLink],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);

  orders$!: Observable<OrderModel[]>;

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orders$ = this.orderService.getOrders();
  }

  validateOrder(orderId: number) {
    this.orderService.validateOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur validation commande', err),
    });
  }

  cancelOrder(orderId: number) {
    this.orderService.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur annulation commande', err),
    });
  }

  deleteOrder(orderId: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer cette commande ?');

    if (!confirmed) return;

    this.orderService.deleteOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: (err) => console.error('Erreur suppression commande', err),
    });
  }

  getSeverity(status: OrderStatus) {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'VALIDATED':
        return 'info';
      case 'IN_DELIVERY':
        return 'warn';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getCustomerName(order: OrderModel) {
    if (!order.customer) {
      return `Client #${order.customerId}`;
    }

    return `${order.customer.firstName} ${order.customer.lastName}`;
  }
}
