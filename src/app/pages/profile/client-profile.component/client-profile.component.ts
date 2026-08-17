import { CommonModule } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { AvatarModule } from 'primeng/avatar'
import { TagModule } from 'primeng/tag'
import { InputTextModule } from 'primeng/inputtext'
import { SkeletonModule } from 'primeng/skeleton'
import { DividerModule } from 'primeng/divider'

import { AuthService } from '../../../auth/auth-service'
import { CustomerService } from '../../customer/customer-service'
import { CustomerModel } from '../../customer/customer.model'
import { AddressModel } from '../../customer/address.model'
import { ClientAddressCardComponent } from '../client-address-card.component/client-address-card.component'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    InputTextModule,
    SkeletonModule,
    DividerModule,
    ClientAddressCardComponent,
    RouterLink,
  ],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.scss',
})
export class ClientProfileComponent implements OnInit {
  private authService = inject(AuthService)
  private customerService = inject(CustomerService)

  loading = signal(false)
  saving = signal(false)
  errorMessage = signal('')
  successMessage = signal('')

  customer = signal<CustomerModel | null>(null)
  user = computed(() => this.authService.currentUser())

  form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl(
      { value: '', disabled: true },
      {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      },
    ),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  })

  fullName = computed(() => {
    const customer = this.customer()

    if (!customer) return 'Client'

    return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Client'
  })

  initials = computed(() => {
    const customer = this.customer()

    if (!customer) return 'CL'

    const first = customer.firstName?.charAt(0)?.toUpperCase() ?? ''
    const last = customer.lastName?.charAt(0)?.toUpperCase() ?? ''

    return `${first}${last}` || 'CL'
  })

  addresses = computed<AddressModel[]>(() => {
    return this.customer()?.addresses ?? []
  })

  defaultAddress = computed<AddressModel | null>(() => {
    const addresses = this.addresses()

    if (!addresses.length) return null

    return addresses.find((address) => address.isDefault) ?? addresses[0]
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
      this.loadCustomer(currentUser.userId)
      return
    }

    this.authService.loadCurrentUser().subscribe({
      next: (user) => {
        if (!user?.userId) {
          this.loading.set(false)
          this.errorMessage.set('Utilisateur connecté introuvable.')
          return
        }

        this.loadCustomer(user.userId)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set('Impossible de charger l’utilisateur connecté.')
      },
    })
  }

  submit(): void {
    const customer = this.customer()

    if (!customer?.id) {
      this.errorMessage.set('Profil client introuvable.')
      return
    }

    this.form.markAllAsTouched()

    if (this.form.invalid) {
      return
    }

    const value = this.form.getRawValue()

    this.saving.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.customerService
      .updateCustomerProfile(customer.id, {
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone,
      })
      .subscribe({
        next: (updatedCustomer) => {
          this.customer.set(updatedCustomer)

          this.form.patchValue({
            firstName: updatedCustomer.firstName,
            lastName: updatedCustomer.lastName,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
          })

          this.saving.set(false)
          this.successMessage.set('Profil mis à jour avec succès.')
        },
        error: (err) => {
          console.error(err)
          this.saving.set(false)
          this.errorMessage.set(
            err?.error?.message || err?.error || 'Erreur lors de la mise à jour du profil.',
          )
        },
      })
  }

  getRoleLabel(): string {
    const role = this.user()?.role

    if (role === 'CUSTOMER') return 'Client'
    if (role === 'ADMIN') return 'Administrateur'
    if (role === 'LOGISTICS_MANAGER') return 'Gestionnaire'
    if (role === 'DELIVERY_AGENT') return 'Livreur'

    return role || 'Utilisateur'
  }
  private loadCustomer(userId: number): void {
    this.customerService.getCustomerByUserId(userId).subscribe({
      next: (customer) => {
        this.customer.set(customer)

        this.form.patchValue({
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
        })

        this.loading.set(false)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger le profil client.',
        )
      },
    })
  }
}
