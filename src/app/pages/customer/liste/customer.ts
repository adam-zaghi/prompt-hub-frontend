import { Component, inject, signal } from '@angular/core'
import { CustomerService } from '../customer-service'
import { TableModule } from 'primeng/table'
import { AsyncPipe, DatePipe } from '@angular/common'
import { AddressModel } from '../address.model'
import {CustomerModel} from '../customer.model'
import { Button } from 'primeng/button'

@Component({
  selector: 'app-customer',
  imports: [TableModule, AsyncPipe, DatePipe, Button],
  templateUrl: './customer.html',
  styleUrl: './customer.scss',
})
export class Customer {
  customerService = inject(CustomerService)

  //observable on peut subscribe ou faire un pipe ou le transformer en signal ici on va pipe
  customers$ = this.customerService.getCustomers()
  getDefaultAddress(customer: CustomerModel): AddressModel | undefined {
    return customer.addresses?.find((address) => address.isDefault)
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
