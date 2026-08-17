import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { ParcelService } from '../../parcel/parcel.service'
import { ParcelModel } from '../../parcel/parcel.model'
import { FormsModule } from '@angular/forms'
import { forkJoin, of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { TagModule } from 'primeng/tag'
import { TableModule } from 'primeng/table'
import { InputTextModule } from 'primeng/inputtext'
import { InputNumberModule } from 'primeng/inputnumber'
import { TextareaModule } from 'primeng/textarea'

import * as L from 'leaflet'

import { TrackingService } from '../tracking.service'
import {
  DeliveryEstimateModel,
  TrackingEventModel,
  UpdatePositionRequest,
} from '../tracking.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-tracking-parcel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
  ],
  templateUrl: './tracking-parcel.component.html',
})
export class TrackingParcelComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private trackingService = inject(TrackingService)

  private parcelService = inject(ParcelService)

  parcelId!: number

  parcel = signal<ParcelModel | null>(null)
  initialLoading = signal(true)
  refreshing = signal(false)
  submitting = signal(false)

  lastPosition = signal<TrackingEventModel | null>(null)
  history = signal<TrackingEventModel[]>([])
  estimate = signal<DeliveryEstimateModel | null>(null)

  private map?: L.Map
  private driverMarker?: L.Marker
  private destinationMarker?: L.Marker

  form: UpdatePositionRequest = {
    parcelId: 0,
    latitude: 33.5731,
    longitude: -7.5898,
    accuracy: 20,
    speed: 0,
    locationLabel: 'Casablanca',
    description: '',
    remainingDistanceMeters: 8000,
    remainingDurationSeconds: 1800,
  }

  ngOnInit(): void {
    this.parcelId = Number(this.route.snapshot.paramMap.get('parcelId'))
    this.form.parcelId = this.parcelId

    this.loadTrackingData(true)
  }

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
  private updateDestinationMap(latitude: number, longitude: number): void {
    if (!this.map) return

    const position: L.LatLngExpression = [latitude, longitude]

    if (!this.destinationMarker) {
      this.destinationMarker = L.marker(position).addTo(this.map)
      this.destinationMarker.bindPopup('Destination client')
    } else {
      this.destinationMarker.setLatLng(position)
    }
  }
  private getDeliveryAddress() {
    const parcel = this.parcel()

    const deliveryAddressId = parcel?.order?.deliveryAddressId
    const addresses = parcel?.order?.customer?.addresses ?? []

    if (!deliveryAddressId) return null

    return addresses.find((address) => address.id === deliveryAddressId) ?? null
  }

  loadTrackingData(firstLoad = false): void {
    if (firstLoad) {
      this.initialLoading.set(true)
    } else {
      this.refreshing.set(true)
    }

    forkJoin({
      history: this.trackingService.getParcelHistory(this.parcelId).pipe(catchError(() => of([]))),

      lastPosition: this.trackingService
        .getLastPosition(this.parcelId)
        .pipe(catchError(() => of(null))),

      estimate: this.trackingService
        .getParcelEstimate(this.parcelId)
        .pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ history, lastPosition, estimate }) => {
        this.history.set(history ?? [])
        this.lastPosition.set(lastPosition)
        this.estimate.set(estimate)

        if (lastPosition) {
          this.form.latitude = lastPosition.latitude
          this.form.longitude = lastPosition.longitude
          this.form.locationLabel = lastPosition.locationLabel || ''
        }

        this.initialLoading.set(false)
        this.refreshing.set(false)

        setTimeout(() => {
          this.initMap()
          this.updateMap(this.form.latitude, this.form.longitude)
        }, 200)
      },
      error: (err) => {
        console.error(err)
        this.initialLoading.set(false)
        this.refreshing.set(false)
      },
    })
  }

  sendPosition(): void {
    this.submitting.set(true)

    this.trackingService.updatePosition(this.form).subscribe({
      next: (event) => {
        this.submitting.set(false)

        this.lastPosition.set(event)
        this.updateMap(event.latitude, event.longitude)

        this.loadTrackingData(false)
      },
      error: (err) => {
        console.error(err)
        this.submitting.set(false)
        alert(err?.error?.message || err?.error || 'Erreur envoi position.')
      },
    })
  }

  useCurrentBrowserPosition(): void {
    if (!navigator.geolocation) {
      alert('La géolocalisation n’est pas supportée par ce navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.latitude = position.coords.latitude
        this.form.longitude = position.coords.longitude
        this.form.accuracy = position.coords.accuracy
        this.form.speed = position.coords.speed ?? 0

        this.updateMap(this.form.latitude, this.form.longitude)
      },
      (error) => {
        console.error(error)
        alert('Impossible de récupérer la position actuelle.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  getDelaySeverity(): TagSeverity {
    return this.estimate()?.delayed ? 'danger' : 'success'
  }

  getDelayLabel(): string {
    if (!this.estimate()) return 'Non disponible'
    return this.estimate()?.delayed ? 'En retard' : 'À l’heure'
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '-'

    const minutes = Math.round(seconds / 60)

    if (minutes < 60) {
      return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}min`
  }

  formatDistance(meters?: number): string {
    if (!meters) return '-'

    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }

    return `${(meters / 1000).toFixed(1)} km`
  }

  private initMap(): void {
    const mapElement = document.getElementById('tracking-map')

    if (!mapElement) {
      return
    }

    if (this.map) {
      this.map.invalidateSize()
      return
    }

    this.map = L.map('tracking-map').setView([this.form.latitude, this.form.longitude], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map)

    this.updateMap(this.form.latitude, this.form.longitude)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 300)
  }

  private updateMap(latitude: number, longitude: number): void {
    if (!this.map) {
      setTimeout(() => {
        this.initMap()
        this.updateMap(latitude, longitude)
      }, 200)
      return
    }

    const position: L.LatLngExpression = [latitude, longitude]

    if (!this.driverMarker) {
      this.driverMarker = L.marker(position).addTo(this.map)
      this.driverMarker.bindPopup('Position livreur')
    } else {
      this.driverMarker.setLatLng(position)
    }

    this.map.setView(position, 13)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 100)
  }
}
