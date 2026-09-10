import { CommonModule } from '@angular/common'
import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { AvatarModule } from 'primeng/avatar'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'
import { DividerModule } from 'primeng/divider'

import { AuthService } from '../../../auth/auth-service'
import { DeliveryAgentService } from '../../delivery-agents/delivery-agent-service'
import { DeliveryAgentModel } from '../../delivery-agents/delivery-agent.model'

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    DividerModule,
  ],
  templateUrl: './driver-profile.html',
  styleUrl: './driver-profile.scss',
})
export class DriverProfile implements OnInit {
  private authService = inject(AuthService)
  private deliveryAgentService = inject(DeliveryAgentService)

  loading = signal(false)
  errorMessage = signal('')
  successMessage = signal('')

  agent = signal<DeliveryAgentModel | null>(null)
  user = computed(() => this.authService.currentUser())

  fullName = computed(() => {
    const agent = this.agent()

    if (!agent) return 'Livreur'

    return `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim() || 'Livreur'
  })

  initials = computed(() => {
    const agent = this.agent()

    if (!agent) return 'LV'

    const first = agent.firstName?.charAt(0)?.toUpperCase() ?? ''
    const last = agent.lastName?.charAt(0)?.toUpperCase() ?? ''

    return `${first}${last}` || 'LV'
  })

  ngOnInit(): void {
    this.loadProfile()
  }

  loadProfile(): void {
    this.loading.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    const currentUser = this.user()

    if (currentUser?.userId) {
      this.loadAgent(currentUser.userId)
      return
    }

    this.authService.loadCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          this.loading.set(false)
          this.errorMessage.set('Utilisateur connecté introuvable.')
          return
        }

        this.loadAgent(user.userId)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger l’utilisateur connecté.')
      },
    })
  }

  private loadAgent(userId: number): void {
    this.deliveryAgentService.getAgentByUserId(userId).subscribe({
      next: (agent) => {
        this.agent.set(agent)
        this.loading.set(false)
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

  getAvailabilityLabel(): string {
    return this.agent()?.available ? 'Disponible' : 'Occupé'
  }

  getAvailabilitySeverity(): 'success' | 'warn' {
    return this.agent()?.available ? 'success' : 'warn'
  }

  getRoleLabel(): string {
    const role = this.user()?.role

    if (role === 'DELIVERY_AGENT') return 'Livreur'
    if (role === 'CUSTOMER') return 'Client'
    if (role === 'ADMIN') return 'Administrateur'
    if (role === 'LOGISTICS_MANAGER') return 'Gestionnaire'

    return role || 'Utilisateur'
  }
}
