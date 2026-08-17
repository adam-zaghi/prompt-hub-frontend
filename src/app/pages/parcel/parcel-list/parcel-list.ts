import { AsyncPipe, DatePipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'

import { TableModule } from 'primeng/table'
import { Button } from 'primeng/button'
import { Tag } from 'primeng/tag'

import { ParcelService } from '../parcel.service'
import { ParcelModel, ParcelStatus } from '../parcel.model'

@Component({
  selector: 'app-parcel-list',
  imports: [TableModule, Button, Tag, AsyncPipe, DatePipe, RouterLink],
  templateUrl: './parcel-list.html',
  styleUrl: './parcel-list.scss',
})
export class ParcelList implements OnInit {
  private parcelService = inject(ParcelService)

  parcels$!: Observable<ParcelModel[]>

  ngOnInit() {
    this.loadParcels()
  }

  loadParcels() {
    this.parcels$ = this.parcelService.getParcels()
  }

  deleteParcel(id: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce colis ?')

    if (!confirmed) return

    this.parcelService.deleteParcel(id).subscribe({
      next: () => this.loadParcels(),
      error: (err) => console.error('Erreur suppression colis', err),
    })
  }

  getSeverity(status: ParcelStatus) {
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
