import { AsyncPipe, DatePipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'

import { TableModule } from 'primeng/table'
import { Button } from 'primeng/button'
import { Tag } from 'primeng/tag'
import { InputText } from 'primeng/inputtext'
import { Tooltip } from 'primeng/tooltip'

import { ParcelService } from '../parcel.service'
import { ParcelModel, ParcelStatus } from '../parcel.model'

@Component({
  selector: 'app-parcel-list',
  imports: [TableModule, Button, Tag, AsyncPipe, DatePipe, RouterLink, InputText, Tooltip],
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

  getStatusLabel(status: ParcelStatus): string {
    switch (status) {
      case 'CREATED':
        return 'Créé'
      case 'READY_TO_SHIP':
        return 'Prêt'
      case 'OUT_FOR_DELIVERY':
        return 'En livraison'
      case 'IN_TRANSIT':
        return 'En transit'
      case 'DELIVERED':
        return 'Livré'
      case 'RETURNED':
        return 'Retourné'
      case 'CANCELLED':
        return 'Annulé'
      default:
        return status
    }
  }

  getParcelSubtitle(status: ParcelStatus): string {
    switch (status) {
      case 'CREATED':
        return 'En attente de préparation'
      case 'READY_TO_SHIP':
        return 'Prêt à être livré'
      case 'OUT_FOR_DELIVERY':
        return 'Livraison en cours'
      case 'IN_TRANSIT':
        return 'En déplacement'
      case 'DELIVERED':
        return 'Colis livré'
      case 'RETURNED':
        return 'Colis retourné'
      case 'CANCELLED':
        return 'Colis annulé'
      default:
        return 'Colis logistique'
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'LOW':
        return 'Faible'
      case 'NORMAL':
        return 'Normale'
      case 'HIGH':
        return 'Haute'
      case 'URGENT':
        return 'Urgente'
      default:
        return priority
    }
  }

  getPrioritySeverity(priority: string) {
    switch (priority) {
      case 'LOW':
        return 'secondary'
      case 'NORMAL':
        return 'info'
      case 'HIGH':
        return 'warn'
      case 'URGENT':
        return 'danger'
      default:
        return 'secondary'
    }
  }
}
