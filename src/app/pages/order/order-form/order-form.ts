import { AsyncPipe } from '@angular/common'
import { Component, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Observable } from 'rxjs'

import { Card } from 'primeng/card'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'

import { CustomerService } from '../../customer/customer-service'
import { CustomerModel } from '../../customer/customer.model'
import { OrderService } from '../order-service'
import { CreateOrderRequest } from '../create-order-request.model'

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, AsyncPipe, Card, Button, InputText, RouterLink],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderForm {
  private orderService = inject(OrderService)
  private customerService = inject(CustomerService)
  private router = inject(Router)

  customers$: Observable<CustomerModel[]> = this.customerService.getCustomers()

  form = new FormGroup({
    customerId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    totalWeight: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.1)],
    }),
  })

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const value = this.form.value

    const request: CreateOrderRequest = {
      customerId: value.customerId!,
      totalWeight: value.totalWeight!,
    }

    this.orderService.createOrder(request).subscribe({
      next: () => {
        this.router.navigateByUrl('/orders')
      },
      error: (err) => {
        console.error('Erreur création commande', err)
      },
    })
  }
}
