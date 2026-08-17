import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { AddressModel } from '../../../../customer/address.model'


@Component({
  selector: 'app-client-address-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule],
  templateUrl: './client-address-card.html',
  styleUrl: './client-address-card.scss',
})
export class ClientAddressCard {
  address = input<AddressModel | null>(null)
}
