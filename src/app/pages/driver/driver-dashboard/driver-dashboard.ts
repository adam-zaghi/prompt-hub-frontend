import { CommonModule } from '@angular/common'
import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'

import { AuthService } from '../../../auth/auth-service'
import { DeliveryAgentService } from '../../delivery-agents/delivery-agent-service'
import { DeliveryAssignmentService } from '../../deliveries/delivery-assignment.service'
import { DeliveryAgentModel } from '../../delivery-agents/delivery-agent.model'
import { DeliveryAssignmentModel, DeliveryStatus } from '../../deliveries/delivery-assignment.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, SkeletonModule],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.scss',
})
export class DriverDashboard implements OnInit {
  private authService = inject(AuthService)
  private deliveryAgentService = inject(DeliveryAgentService)
  private deliveryAssignmentService = inject(DeliveryAssignmentService)

  loading = signal(false)
  errorMessage = signal<string | null>(null)

  agent = signal<DeliveryAgentModel | null>(null)
  assignments = signal<DeliveryAssignmentModel[]>([])

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

  problemCount = computed(
    () =>
      this.assignments().filter((item) => item.status === 'FAILED' || item.status === 'CANCELLED')
        .length,
  )

  activeDelivery = computed(
    () => this.assignments().find((item) => item.status === 'IN_PROGRESS') ?? null,
  )

  nextDelivery = computed(
    () => this.assignments().find((item) => item.status === 'ASSIGNED') ?? null,
  )

  recentDeliveries = computed(() => {
    return [...this.assignments()]
      .sort((a, b) => {
        const dateA = new Date(a.assignedAt ?? '').getTime()
        const dateB = new Date(b.assignedAt ?? '').getTime()
        return dateB - dateA
      })
      .slice(0, 4)
  })

  completionRate = computed(() => {
    const total = this.totalAssignments()

    if (total === 0) return 0

    return Math.round((this.deliveredCount() / total) * 100)
  })

  ngOnInit(): void {
    this.loadDashboard()
  }

  loadDashboard(): void {
    this.loading.set(true)
    this.errorMessage.set(null)

    const currentUser = this.authService.currentUser()
    const userId = currentUser?.userId

    if (!userId) {
      this.loading.set(false)
      this.errorMessage.set('Utilisateur connecté introuvable.')
      return
    }

    this.deliveryAgentService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agent.set(agent)
        this.loadAssignments(agent.id)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger le profil livreur.')
      },
    })
  }

  private loadAssignments(agentId: number): void {
    this.deliveryAssignmentService.getAssignmentsByAgentId(agentId).subscribe({
      next: (data) => {
        this.assignments.set(data ?? [])
        this.loading.set(false)
      },
      error: (err) => {
        console.error(err)
        this.assignments.set([])
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger vos livraisons.')
      },
    })
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

  getInitials(): string {
    const currentAgent = this.agent()

    if (!currentAgent) return '-'

    const firstName = currentAgent.firstName?.charAt(0) ?? ''
    const lastName = currentAgent.lastName?.charAt(0) ?? ''

    return `${firstName}${lastName}`.toUpperCase()
  }
}
