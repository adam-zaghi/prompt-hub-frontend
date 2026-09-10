import { Component, inject } from '@angular/core'
import { CustomerService } from '../customer-service'
import { TableModule } from 'primeng/table'
import { AsyncPipe, DatePipe } from '@angular/common'
import { AddressModel } from '../address.model'
import { CustomerModel } from '../customer.model'
import { Button } from 'primeng/button'
import { RouterLink } from '@angular/router'
import { InputText } from 'primeng/inputtext'
import { Tooltip } from 'primeng/tooltip'

@Component({
  selector: 'app-customer',
  imports: [TableModule, AsyncPipe, DatePipe, Button, RouterLink, InputText, Tooltip],
  templateUrl: './customer.html',
  styleUrl: './customer.scss',
})
export class Customer {
  customerService = inject(CustomerService)

  customers$ = this.customerService.getCustomers()

  getDefaultAddress(customer: CustomerModel): AddressModel | undefined {
    return customer.addresses?.find((address) => address.isDefault)
  }

  getInitials(customer: CustomerModel): string {
    const firstNameInitial = customer.firstName?.charAt(0) ?? ''
    const lastNameInitial = customer.lastName?.charAt(0) ?? ''

    return `${firstNameInitial}${lastNameInitial}`.toUpperCase()
  }

  loadCustomers() {
    this.customers$ = this.customerService.getCustomers()
  }

  deleteCustomer(id: number) {
    const confirmed = confirm('Voulez-vous vraiment supprimer ce client ?')

    if (!confirmed) return

    this.customerService.deleteCustomer(id).subscribe({
      next: () => {
        this.loadCustomers()
      },
      error: (err) => {
        console.error('Erreur suppression customer', err)
      },
    })
  }
}
