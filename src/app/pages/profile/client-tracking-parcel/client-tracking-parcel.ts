import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { forkJoin, of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { TableModule } from 'primeng/table'
import { SkeletonModule } from 'primeng/skeleton'

import * as L from 'leaflet'

import { TrackingService } from '../../tracking/tracking.service'
import { DeliveryEstimateModel, TrackingEventModel } from '../../tracking/tracking.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

@Component({
  selector: 'app-client-tracking-parcel',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    SkeletonModule,
  ],
  templateUrl: './client-tracking-parcel.html',
  styleUrl: './client-tracking-parcel.scss',
})
export class ClientTrackingParcel implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private trackingService = inject(TrackingService)

  parcelId!: number

  loading = signal(true)
  refreshing = signal(false)
  errorMessage = signal('')

  lastPosition = signal<TrackingEventModel | null>(null)
  history = signal<TrackingEventModel[]>([])
  estimate = signal<DeliveryEstimateModel | null>(null)

  private map?: L.Map
  private driverMarker?: L.Marker

  private readonly defaultLatitude = 33.5731
  private readonly defaultLongitude = -7.5898

  ngOnInit(): void {
    this.parcelId = Number(this.route.snapshot.paramMap.get('parcelId'))

    if (!this.parcelId) {
      this.loading.set(false)
      this.errorMessage.set('Colis introuvable.')
      return
    }

    this.loadTracking(true)
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

  loadTracking(firstLoad = false): void {
    if (firstLoad) {
      this.loading.set(true)
    } else {
      this.refreshing.set(true)
    }

    this.errorMessage.set('')

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

        this.loading.set(false)
        this.refreshing.set(false)

        const latitude = lastPosition?.latitude ?? this.defaultLatitude
        const longitude = lastPosition?.longitude ?? this.defaultLongitude

        setTimeout(() => {
          this.initMap()
          this.updateDriverMarker(latitude, longitude)
        }, 200)
      },
      error: (err) => {
        console.error(err)
        this.loading.set(false)
        this.refreshing.set(false)
        this.errorMessage.set('Impossible de charger le tracking du colis.')
      },
    })
  }

  getTrackingStatusLabel(): string {
    if (!this.lastPosition()) {
      return 'Tracking pas encore disponible'
    }

    if (this.estimate()?.delayed) {
      return 'Livraison en retard'
    }

    return 'Livraison en cours'
  }

  getTrackingStatusSeverity(): TagSeverity {
    if (!this.lastPosition()) {
      return 'secondary'
    }

    if (this.estimate()?.delayed) {
      return 'danger'
    }

    return 'success'
  }

  getDelayLabel(): string {
    if (!this.estimate()) {
      return 'Non disponible'
    }

    return this.estimate()?.delayed ? 'En retard' : 'À l’heure'
  }

  getDelaySeverity(): TagSeverity {
    return this.estimate()?.delayed ? 'danger' : 'success'
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
    const mapElement = document.getElementById('client-tracking-map')

    if (!mapElement) return

    if (this.map) {
      this.map.invalidateSize()
      return
    }

    const last = this.lastPosition()

    const latitude = last?.latitude ?? this.defaultLatitude
    const longitude = last?.longitude ?? this.defaultLongitude

    this.map = L.map('client-tracking-map').setView([latitude, longitude], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map)

    this.updateDriverMarker(latitude, longitude)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 300)
  }

  private updateDriverMarker(latitude: number, longitude: number): void {
    if (!this.map) return

    const position: L.LatLngExpression = [latitude, longitude]

    if (!this.driverMarker) {
      this.driverMarker = L.marker(position).addTo(this.map)
      this.driverMarker.bindPopup('Position du livreur')
    } else {
      this.driverMarker.setLatLng(position)
    }

    this.map.setView(position, 13)

    setTimeout(() => {
      this.map?.invalidateSize()
    }, 100)
  }
}
