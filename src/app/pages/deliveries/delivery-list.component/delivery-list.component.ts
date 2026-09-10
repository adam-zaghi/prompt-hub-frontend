import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

import { TableModule } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { DeliveryAssignmentService } from '../delivery-assignment.service'
import { DeliveryAssignmentModel, DeliveryStatus } from '../delivery-assignment.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    RouterLink,
    InputTextModule,
    TooltipModule,
  ],
  templateUrl: './delivery-list.component.html',
  styleUrl: './delivery-list.component.scss',
})
export class DeliveryListComponent implements OnInit {
  private deliveryAssignmentService = inject(DeliveryAssignmentService)

  assignments = signal<DeliveryAssignmentModel[]>([])
  loading = signal(false)

  ngOnInit(): void {
    this.loadAssignments()
  }

  loadAssignments(): void {
    this.loading.set(true)

    this.deliveryAssignmentService.getAssignments().subscribe({
      next: (data) => {
        this.assignments.set(data ?? [])
        this.loading.set(false)
      },
      error: (err) => {
        console.error('Erreur chargement livraisons', err)
        this.loading.set(false)
      },
    })
  }

  startDelivery(id: number): void {
    this.deliveryAssignmentService.startDelivery(id).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => this.showError(err, 'Erreur démarrage livraison'),
    })
  }

  completeDelivery(id: number): void {
    this.deliveryAssignmentService.completeDelivery(id).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => this.showError(err, 'Erreur finalisation livraison'),
    })
  }

  failDelivery(id: number): void {
    const notes = prompt('Pourquoi la livraison a échoué ?') ?? ''

    this.deliveryAssignmentService.failDelivery(id, notes).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => this.showError(err, 'Erreur échec livraison'),
    })
  }

  cancelDelivery(id: number): void {
    const confirmed = confirm('Voulez-vous vraiment annuler cette livraison ?')
    if (!confirmed) return

    this.deliveryAssignmentService.cancelDelivery(id).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => this.showError(err, 'Erreur annulation livraison'),
    })
  }

  deleteAssignment(id: number): void {
    const confirmed = confirm('Voulez-vous vraiment supprimer cette affectation ?')
    if (!confirmed) return

    this.deliveryAssignmentService.deleteAssignment(id).subscribe({
      next: () => this.loadAssignments(),
      error: (err) => this.showError(err, 'Erreur suppression affectation'),
    })
  }

  canStart(status: DeliveryStatus): boolean {
    return status === 'ASSIGNED'
  }

  canComplete(status: DeliveryStatus): boolean {
    return status === 'IN_PROGRESS'
  }

  canFail(status: DeliveryStatus): boolean {
    return status === 'IN_PROGRESS'
  }

  canCancel(status: DeliveryStatus): boolean {
    return status === 'ASSIGNED'
  }

  getStatusSeverity(status: DeliveryStatus): TagSeverity {
    switch (status) {
      case 'ASSIGNED':
        return 'info'
      case 'IN_PROGRESS':
        return 'warn'
      case 'DELIVERED':
        return 'success'
      case 'FAILED':
      case 'CANCELLED':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  getStatusLabel(status: DeliveryStatus): string {
    switch (status) {
      case 'ASSIGNED':
        return 'Affectée'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'DELIVERED':
        return 'Livrée'
      case 'FAILED':
        return 'Échouée'
      case 'CANCELLED':
        return 'Annulée'
      default:
        return status
    }
  }

  getDeliverySubtitle(status: DeliveryStatus): string {
    switch (status) {
      case 'ASSIGNED':
        return 'En attente de démarrage'
      case 'IN_PROGRESS':
        return 'Livraison en cours'
      case 'DELIVERED':
        return 'Livraison terminée'
      case 'FAILED':
        return 'Problème signalé'
      case 'CANCELLED':
        return 'Livraison annulée'
      default:
        return 'Affectation logistique'
    }
  }

  getAgentName(assignment: DeliveryAssignmentModel): string {
    if (!assignment.agent) return '-'
    return `${assignment.agent.firstName} ${assignment.agent.lastName}`
  }

  getAgentInitials(assignment: DeliveryAssignmentModel): string {
    if (!assignment.agent) return '-'

    const firstNameInitial = assignment.agent.firstName?.charAt(0) ?? ''
    const lastNameInitial = assignment.agent.lastName?.charAt(0) ?? ''

    return `${firstNameInitial}${lastNameInitial}`.toUpperCase()
  }

  private showError(err: any, fallbackMessage: string): void {
    console.error(err)
    alert(err?.error?.message || err?.error || fallbackMessage)
  }
}
