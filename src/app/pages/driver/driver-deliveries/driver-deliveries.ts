import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'

import { AuthService } from '../../../auth/auth-service'
import { DeliveryAgentService } from '../../delivery-agents/delivery-agent-service'
import { DeliveryAgentModel } from '../../delivery-agents/delivery-agent.model'
import { DeliveryAssignmentService } from '../../deliveries/delivery-assignment.service'
import { DeliveryAssignmentModel, DeliveryStatus } from '../../deliveries/delivery-assignment.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './driver-deliveries.html',
  styleUrl: './driver-deliveries.scss',
})
export class DriverDeliveries implements OnInit {
  private authService = inject(AuthService)
  private deliveryAgentService = inject(DeliveryAgentService)
  private deliveryAssignmentService = inject(DeliveryAssignmentService)

  loading = signal(false)
  actionLoading = signal<number | null>(null)
  errorMessage = signal('')
  successMessage = signal('')

  agent = signal<DeliveryAgentModel | null>(null)
  assignments = signal<DeliveryAssignmentModel[]>([])

  user = computed(() => this.authService.currentUser())

  totalAssignments = computed(() => this.assignments().length)

  assignedCount = computed(
    () => this.assignments().filter((item) => item.status === 'ASSIGNED').length,
  )

  inProgressCount = computed(
    () => this.assignments().filter((item) => item.status === 'IN_PROGRESS').length,
  )

  deliveredCount = computed(
    () => this.assignments().filter((item) => item.status === 'DELIVERED').length,
  )

  failedCount = computed(() => this.assignments().filter((item) => item.status === 'FAILED').length)

  ngOnInit(): void {
    this.loadPage()
  }

  loadPage(): void {
    this.loading.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    const currentUser = this.user()

    if (currentUser?.userId) {
      this.loadAgentAndDeliveries(currentUser.userId)
      return
    }

    this.authService.loadCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          this.loading.set(false)
          this.errorMessage.set('Utilisateur connecté introuvable.')
          return
        }

        this.loadAgentAndDeliveries(user.userId)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger l’utilisateur connecté.')
      },
    })
  }

  private loadAgentAndDeliveries(userId: number): void {
    this.deliveryAgentService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        if (!agent?.id) {
          this.loading.set(false)
          this.errorMessage.set('Profil livreur introuvable pour ce compte.')
          return
        }

        this.agent.set(agent)
        this.loadDeliveries(agent.id)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger le profil livreur.',
        )
      },
    })
  }

  private loadDeliveries(agentId: number): void {
    this.deliveryAssignmentService.getAssignmentsByAgentId(agentId).subscribe({
      next: (assignments) => {
        this.assignments.set(assignments ?? [])
        this.loading.set(false)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger vos livraisons.',
        )
      },
    })
  }

  startDelivery(assignment: DeliveryAssignmentModel): void {
    if (assignment.status !== 'ASSIGNED') return

    this.actionLoading.set(assignment.id)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.deliveryAssignmentService.startDelivery(assignment.id).subscribe({
      next: () => {
        this.actionLoading.set(null)
        this.successMessage.set('Livraison démarrée.')
        this.loadPage()
      },
      error: (err) => {
        console.error(err)
        this.actionLoading.set(null)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de démarrer la livraison.',
        )
      },
    })
  }

  completeDelivery(assignment: DeliveryAssignmentModel): void {
    if (assignment.status !== 'IN_PROGRESS') return

    this.actionLoading.set(assignment.id)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.deliveryAssignmentService.completeDelivery(assignment.id).subscribe({
      next: () => {
        this.actionLoading.set(null)
        this.successMessage.set('Livraison terminée.')
        this.loadPage()
      },
      error: (err) => {
        console.error(err)
        this.actionLoading.set(null)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de terminer la livraison.',
        )
      },
    })
  }

  getStatusLabel(status?: DeliveryStatus): string {
    switch (status) {
      case 'ASSIGNED':
        return 'Assignée'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'DELIVERED':
        return 'Livrée'
      case 'FAILED':
        return 'Échec'
      case 'CANCELLED':
        return 'Annulée'
      default:
        return status || '-'
    }
  }

  getStatusSeverity(status?: DeliveryStatus): TagSeverity {
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

  canStart(assignment: DeliveryAssignmentModel): boolean {
    return assignment.status === 'ASSIGNED'
  }

  canComplete(assignment: DeliveryAssignmentModel): boolean {
    return assignment.status === 'IN_PROGRESS'
  }

  canSendPosition(assignment: DeliveryAssignmentModel): boolean {
    return assignment.status === 'IN_PROGRESS'
  }
}
