import { AsyncPipe, DatePipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { Observable } from 'rxjs'

import { Card } from 'primeng/card'
import { TableModule } from 'primeng/table'
import { Button } from 'primeng/button'
import { Tag } from 'primeng/tag'

import { OrderService } from '../order-service'
import { OrderModel } from '../order.model'
import { ParcelService } from '../../parcel/parcel.service'
import { ParcelModel, ParcelStatus } from '../../parcel/parcel.model'

@Component({
  selector: 'app-order-detail',
  imports: [AsyncPipe, DatePipe, RouterLink, Card, TableModule, Button, Tag],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute)
  private orderService = inject(OrderService)
  private parcelService = inject(ParcelService)

  orderId!: number

  order$!: Observable<OrderModel>
  parcels$!: Observable<ParcelModel[]>

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'))
    this.loadData()
  }

  loadData() {
    this.order$ = this.orderService.getOrderById(this.orderId)
    this.parcels$ = this.parcelService.getParcelsByOrderId(this.orderId)
  }
  canAssignParcel(status: string): boolean {
    return status === 'CREATED' || status === 'READY_TO_SHIP'
  }

  deleteParcel(id: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce colis ?')

    if (!confirmed) return

    this.parcelService.deleteParcel(id).subscribe({
      next: () => this.loadData(),
      error: (err) => console.error('Erreur suppression colis', err),
    })
  }

  getParcelSeverity(status: ParcelStatus) {
    switch (status) {
      case 'CREATED':
        return 'secondary'
      case 'READY_TO_SHIP':
        return 'info'
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
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
}
