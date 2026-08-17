import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import { CardModule } from 'primeng/card'

@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.scss',
})
export class DashboardStatCard {
  title = input.required<string>()
  value = input.required<number>()
  icon = input.required<string>()
  subtitle = input<string>('')
}
