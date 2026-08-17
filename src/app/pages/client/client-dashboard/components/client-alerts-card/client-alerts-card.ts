import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'

import { CardModule } from 'primeng/card'
import { TagModule } from 'primeng/tag'

@Component({
  selector: 'app-client-alerts-card',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './client-alerts-card.html',
  styleUrl: './client-alerts-card.scss',
})
export class ClientAlertsCard {
  delayedCount = input<number>(0)
  activeDelivery = input<unknown | null>(null)
}
