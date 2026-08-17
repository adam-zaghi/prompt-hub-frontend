import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { forkJoin } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { SelectModule } from 'primeng/select'
import { TextareaModule } from 'primeng/textarea'
import { CardModule } from 'primeng/card'
import { TagModule } from 'primeng/tag'

import { DeliveryAssignmentService } from '../delivery-assignment.service'
import { DeliveryAgentService } from '../../delivery-agents/delivery-agent-service'
import { ParcelService } from '../../parcel/parcel.service'

import { DeliveryAgentModel } from '../../delivery-agents/delivery-agent.model'
import { ParcelModel } from '../../parcel/parcel.model'
import { AssignDeliveryRequest } from '../delivery-assignment.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-delivery-assign',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    TextareaModule,
    CardModule,
    TagModule,
  ],
  templateUrl: './delivery-assign.component.html',
})
export class DeliveryAssignComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)

  private deliveryAssignmentService = inject(DeliveryAssignmentService)
  private deliveryAgentService = inject(DeliveryAgentService)
  private parcelService = inject(ParcelService)

  parcelId!: number

  loaded = signal(false)
  submitting = signal(false)

  parcel = signal<ParcelModel | undefined>(undefined)
  agents = signal<DeliveryAgentModel[]>([])

  selectedAgentId?: number
  notes = ''

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('parcelId'))

    if (!id) {
      alert('Aucun colis sélectionné.')
      this.router.navigate(['/parcels'])
      return
    }

    this.parcelId = id
    this.loadData()
  }

  loadData(): void {
    this.loaded.set(false)

    forkJoin({
      parcel: this.parcelService.getParcelById(this.parcelId),
      agents: this.deliveryAgentService.getAvailableAgents(),
    }).subscribe({
      next: ({ parcel, agents }) => {
        this.parcel.set(parcel)
        this.agents.set(agents ?? [])
        this.loaded.set(true)

        console.log('loaded =', this.loaded())
        console.log('parcel =', this.parcel())
        console.log('agents =', this.agents())
      },
      error: (err) => {
        console.error(err)
        this.loaded.set(true)
        alert('Erreur lors du chargement des données.')
      },
    })
  }

  assign(): void {
    if (!this.selectedAgentId) {
      alert('Veuillez choisir un livreur.')
      return
    }

    const request: AssignDeliveryRequest = {
      parcelId: this.parcelId,
      agentId: this.selectedAgentId,
      notes: this.notes,
    }

    this.submitting.set(true)

    this.deliveryAssignmentService.assignParcelToAgent(request).subscribe({
      next: () => {
        this.submitting.set(false)
        this.router.navigate(['/deliveries'])
      },
      error: (err) => {
        console.error(err)
        this.submitting.set(false)
        alert(err?.error?.message || err?.error || 'Erreur lors de l’affectation.')
      },
    })
  }

  getParcelSeverity(status?: string): TagSeverity {
    switch (status) {
      case 'CREATED':
        return 'info'
      case 'READY_TO_SHIP':
      case 'OUT_FOR_DELIVERY':
        return 'warn'
      case 'DELIVERED':
        return 'success'
      case 'CANCELLED':
      case 'RETURNED':
        return 'danger'
      default:
        return 'secondary'
    }
  }
}
