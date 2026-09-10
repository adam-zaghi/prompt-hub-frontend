import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { DeliveryAgentService } from '../delivery-agent-service'
import { DeliveryAgentModel } from '../delivery-agent.model'

@Component({
  selector: 'app-delivery-agent-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TooltipModule,
  ],
  templateUrl: './delivery-agent-list.component.html',
  styleUrl: './delivery-agent-list.component.scss',
})
export class DeliveryAgentListComponent implements OnInit {
  private deliveryAgentService = inject(DeliveryAgentService)
  private cdr = inject(ChangeDetectorRef)

  agents: DeliveryAgentModel[] = []
  loading = false

  ngOnInit(): void {
    setTimeout(() => {
      this.loadAgents()
    })
  }

  loadAgents(): void {
    this.loading = true

    this.deliveryAgentService.getAgents().subscribe({
      next: (data) => {
        this.agents = data ?? []
        this.loading = false
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error('Erreur chargement livreurs', err)
        this.agents = []
        this.loading = false
        this.cdr.detectChanges()
      },
    })
  }

  deleteAgent(id: number): void {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce livreur ?')

    if (!confirmed) return

    this.deliveryAgentService.deleteAgent(id).subscribe({
      next: () => this.loadAgents(),
      error: (err) => console.error('Erreur suppression livreur', err),
    })
  }

  getAvailabilitySeverity(agent: DeliveryAgentModel): 'success' | 'danger' {
    return agent.available ? 'success' : 'danger'
  }

  getAvailabilityLabel(agent: DeliveryAgentModel): string {
    return agent.available ? 'Disponible' : 'Occupé'
  }

  getInitials(agent: DeliveryAgentModel): string {
    const firstNameInitial = agent.firstName?.charAt(0) ?? ''
    const lastNameInitial = agent.lastName?.charAt(0) ?? ''

    return `${firstNameInitial}${lastNameInitial}`.toUpperCase()
  }
}
