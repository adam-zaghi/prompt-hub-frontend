import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CustomerService } from '../customer-service'
import { Card } from 'primeng/card'
import { InputText } from 'primeng/inputtext'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Button } from 'primeng/button'
import { CreateCustomerRequest } from '../create-customer-request.model'
import { Router, RouterLink } from '@angular/router'

import * as L from 'leaflet'

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [CommonModule, Card, InputText, ReactiveFormsModule, Button, RouterLink],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form implements AfterViewInit, OnDestroy {
  private customerService = inject(CustomerService)
  private router = inject(Router)

  mode = signal<'create' | 'update'>('create')

  private map?: L.Map
  private marker?: L.Marker

  private readonly defaultLatitude = 33.5731
  private readonly defaultLongitude = -7.5898

  form = new FormGroup({
    userEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    country: new FormControl('Morocco', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    state: new FormControl(''),
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    city: new FormControl('Casablanca', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    latitude: new FormControl<number | null>(this.defaultLatitude, {
      validators: [Validators.required],
    }),

    longitude: new FormControl<number | null>(this.defaultLongitude, {
      validators: [Validators.required],
    }),
  })

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap()
    }, 200)
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove()
      this.map = undefined
    }
  }

  toggle(): void {
    this.mode.set(this.mode() === 'create' ? 'update' : 'create')
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }

    const value = this.form.getRawValue()

    if (value.latitude === null || value.longitude === null) {
      alert('Veuillez choisir la position sur la carte.')
      return
    }

    const request: CreateCustomerRequest = {
      userEmail: value.userEmail,
      defaultAddress: {
        street: value.street,
        city: value.city,
        state: value.state ?? '',
        postalCode: value.postalCode,
        country: value.country,
        isDefault: true,
        latitude: Number(value.latitude),
        longitude: Number(value.longitude),
      },
    }

    this.customerService.createCustomer(request).subscribe({
      next: () => {
        this.router.navigate(['/customers'])
      },
      error: (err) => {
        console.error(err)
        alert(err?.error?.message || err?.error || 'Erreur création client.')
      },
    })
  }

  useCurrentPosition(): void {
    if (!navigator.geolocation) {
      alert('La géolocalisation n’est pas supportée par ce navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setAddressPosition(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error(error)
        alert('Impossible de récupérer votre position actuelle.')
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
      alert('Latitude ou longitude invalide.')
      return
    }

    this.setAddressPosition(latitude, longitude)
  }

  private initMap(): void {
    const mapElement = document.getElementById('customer-address-map')

    if (!mapElement) return

    this.map = L.map('customer-address-map').setView(
      [this.defaultLatitude, this.defaultLongitude],
      12,
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map)

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.setAddressPosition(event.latlng.lat, event.latlng.lng)
    })

    this.setAddressPosition(this.defaultLatitude, this.defaultLongitude)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 300)
  }

  private setAddressPosition(latitude: number, longitude: number): void {
    const lat = Number(latitude.toFixed(6))
    const lng = Number(longitude.toFixed(6))

    this.form.patchValue({
      latitude: lat,
      longitude: lng,
    })

    if (!this.map) return

    const position: L.LatLngExpression = [lat, lng]

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
