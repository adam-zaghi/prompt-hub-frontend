import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { ParcelModel } from '../../../../parcel/parcel.model'
import { DeliveryEstimateModel } from '../../../../tracking/tracking.model'


interface ActiveDeliveryView {
  parcel: ParcelModel
  estimate?: DeliveryEstimateModel | null
}

@Component({
  selector: 'app-client-active-delivery-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, TagModule],
  templateUrl: './client-active-delivery-card.html',
  styleUrl: './client-active-delivery-card.scss',
})
export class ClientActiveDeliveryCard {
  activeDelivery = input<ActiveDeliveryView | null>(null)

  formatDistance(meters?: number | null): string {
    if (meters == null) return '-'
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  formatDuration(seconds?: number | null): string {
    if (seconds == null) return '-'

    const minutes = Math.round(seconds / 60)

    if (minutes < 60) return `${minutes} min`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}min`
  }

  getDelayLabel(): string {
    const estimate = this.activeDelivery()?.estimate

    if (!estimate?.updatedAt) return 'Non calculé'

    return estimate.delayed ? 'En retard' : 'À l’heure'
  }

  getDelaySeverity(): 'success' | 'danger' | 'secondary' {
    const estimate = this.activeDelivery()?.estimate

    if (!estimate?.updatedAt) return 'secondary'

    return estimate.delayed ? 'danger' : 'success'
  }
}
