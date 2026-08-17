import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'

import { FormsModule } from '@angular/forms'

import { InputTextModule } from 'primeng/inputtext'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'

import { DeliveryAgentService } from '../delivery-agent-service'
import { CreateDeliveryAgentRequest } from '../delivery-agent.model'

@Component({
  selector: 'app-delivery-agent-form',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './delivery-agent-form.component.html',
})
export class DeliveryAgentFormComponent {
  private deliveryAgentService = inject(DeliveryAgentService)
  private router = inject(Router)

  loading = false

  form: CreateDeliveryAgentRequest = {
    userEmail: '',
    currentCity: '',
    available: true,
  }

  createAgent(): void {
    if (!this.form.userEmail || !this.form.currentCity) {
      alert('Veuillez remplir l’email du user et la ville actuelle.')
      return
    }

    this.loading = true

    this.deliveryAgentService.createAgent(this.form).subscribe({
      next: () => {
        this.loading = false
        this.router.navigate(['/delivery-agents'])
      },
      error: (err) => {
        console.error('Erreur création livreur', err)
        this.loading = false

        const message = err?.error?.message || err?.error || 'Erreur lors de la création du livreur'
        alert(message)
      },
    })
  }
}
