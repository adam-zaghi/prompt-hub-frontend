import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SkeletonModule } from 'primeng/skeleton'
import { TagModule } from 'primeng/tag'

import * as L from 'leaflet'

import { CustomerService } from '../../customer/customer-service'
import { AddressModel } from '../../customer/address.model'

@Component({
  selector: 'app-client-address-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    SkeletonModule,
    TagModule,
  ],
  templateUrl: './client-address-edit-component.html',
  styleUrl: './client-address-edit-component.scss',
})
export class ClientAddressEditComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private customerService = inject(CustomerService)

  addressId!: number

  loading = signal(true)
  saving = signal(false)
  errorMessage = signal('')
  successMessage = signal('')

  address = signal<AddressModel | null>(null)

  private map?: L.Map
  private marker?: L.Marker

  private readonly defaultLatitude = 33.5731
  private readonly defaultLongitude = -7.5898

  form = new FormGroup({
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    state: new FormControl('', {
      nonNullable: true,
    }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    country: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    latitude: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    longitude: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
  })

  ngOnInit(): void {
    this.addressId = Number(this.route.snapshot.paramMap.get('addressId'))

    if (!this.addressId) {
      this.errorMessage.set('Adresse introuvable.')
      this.loading.set(false)
      return
    }

    this.loadAddress()
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap()
    }, 300)
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove()
      this.map = undefined
    }
  }

  loadAddress(): void {
    this.loading.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.customerService.getAddressById(this.addressId).subscribe({
      next: (address) => {
        this.address.set(address)

        this.form.patchValue({
          street: address.street ?? '',
          city: address.city ?? '',
          state: address.state ?? '',
          postalCode: address.postalCode ?? '',
          country: address.country ?? '',
          latitude: address.latitude ?? this.defaultLatitude,
          longitude: address.longitude ?? this.defaultLongitude,
        })

        this.loading.set(false)

        setTimeout(() => {
          this.initMap()
          this.updateMapPosition(
            this.form.controls.latitude.value ?? this.defaultLatitude,
            this.form.controls.longitude.value ?? this.defaultLongitude,
          )
        }, 200)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Impossible de charger cette adresse.',
        )
      },
    })
  }

  submit(): void {
    this.form.markAllAsTouched()

    if (this.form.invalid) {
      return
    }

    const value = this.form.getRawValue()

    if (value.latitude === null || value.longitude === null) {
      this.errorMessage.set('Veuillez choisir une position sur la carte.')
      return
    }

    this.saving.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.customerService
      .updateAddress(this.addressId, {
        street: value.street,
        city: value.city,
        state: value.state,
        postalCode: value.postalCode,
        country: value.country,
        latitude: Number(value.latitude),
        longitude: Number(value.longitude),
      })
      .subscribe({
        next: (updatedAddress) => {
          this.address.set(updatedAddress)

          this.form.patchValue({
            street: updatedAddress.street,
            city: updatedAddress.city,
            state: updatedAddress.state ?? '',
            postalCode: updatedAddress.postalCode,
            country: updatedAddress.country,
            latitude: updatedAddress.latitude,
            longitude: updatedAddress.longitude,
          })

          this.saving.set(false)
          this.successMessage.set('Adresse mise à jour avec succès.')

          setTimeout(() => {
            this.router.navigate(['/client/profile'])
          }, 600)
        },
        error: (err) => {
          console.error(err)
          this.saving.set(false)
          this.errorMessage.set(
            err?.error?.message || err?.error || 'Erreur lors de la mise à jour de l’adresse.',
          )
        },
      })
  }

  useCurrentPosition(): void {
    if (!navigator.geolocation) {
      this.errorMessage.set('La géolocalisation n’est pas supportée par ce navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setPosition(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error(error)
        this.errorMessage.set('Impossible de récupérer votre position actuelle.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  centerMapOnFormPosition(): void {
    const latitude = this.form.controls.latitude.value
    const longitude = this.form.controls.longitude.value

    if (latitude === null || longitude === null) {
      this.errorMessage.set('Latitude ou longitude invalide.')
      return
    }

    this.setPosition(latitude, longitude)
  }
  setAsDefault(): void {
    if (!this.addressId) return

    this.saving.set(true)
    this.errorMessage.set('')
    this.successMessage.set('')

    this.customerService.setDefaultAddress(this.addressId).subscribe({
      next: (updatedAddress) => {
        this.address.set(updatedAddress)
        this.saving.set(false)
        this.successMessage.set('Adresse définie comme adresse principale.')
      },
      error: (err) => {
        console.error(err)
        this.saving.set(false)
        this.errorMessage.set(
          err?.error?.message ||
            err?.error ||
            'Impossible de définir cette adresse comme principale.',
        )
      },
    })
  }
  private initMap(): void {
    const mapElement = document.getElementById('client-address-edit-map')

    if (!mapElement) return

    if (this.map) {
      this.map.invalidateSize()
      return
    }

    const latitude = this.form.controls.latitude.value ?? this.defaultLatitude
    const longitude = this.form.controls.longitude.value ?? this.defaultLongitude

    this.map = L.map('client-address-edit-map').setView([latitude, longitude], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map)

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.setPosition(event.latlng.lat, event.latlng.lng)
    })

    this.updateMapPosition(latitude, longitude)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 300)
  }

  private setPosition(latitude: number, longitude: number): void {
    const lat = Number(latitude.toFixed(6))
    const lng = Number(longitude.toFixed(6))

    this.form.patchValue({
      latitude: lat,
      longitude: lng,
    })

    this.updateMapPosition(lat, lng)
  }

  private updateMapPosition(latitude: number, longitude: number): void {
    if (!this.map) return

    const position: L.LatLngExpression = [latitude, longitude]

    if (!this.marker) {
      this.marker = L.marker(position).addTo(this.map)
      this.marker.bindPopup('Adresse de livraison')
    } else {
      this.marker.setLatLng(position)
    }

    this.map.setView(position, 14)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 100)
  }
}
