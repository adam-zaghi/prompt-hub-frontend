import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { Router } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'

import { AddressModel } from '../../customer/address.model'

@Component({
  selector: 'app-client-address-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
  templateUrl: './client-address-card.component.html',
  styleUrl: './client-address-card.component.scss',
})
export class ClientAddressCardComponent {
  private router = inject(Router)

  @Input({ required: true }) address!: AddressModel

  get fullAddress(): string {
    return [
      this.address.street,
      this.address.city,
      this.address.state,
      this.address.postalCode,
      this.address.country,
    ]
      .filter(Boolean)
      .join(', ')
  }

  openEdit(): void {
    if (!this.address.id) return

    this.router.navigate(['/client/addresses', this.address.id, 'edit'])
  }
}
