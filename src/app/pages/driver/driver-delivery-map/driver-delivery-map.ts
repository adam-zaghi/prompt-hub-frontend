import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core'
import { CommonModule } from '@angular/common'

import { CardModule } from 'primeng/card'
import { TagModule } from 'primeng/tag'

import * as L from 'leaflet'

import { DeliveryDestinationModel } from '../../tracking/tracking.model'

export type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'

export interface DriverPosition {
  latitude: number
  longitude: number
  accuracy?: number | null
  speed?: number | null
}

@Component({
  selector: 'app-driver-delivery-map',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './driver-delivery-map.html',
  styleUrl: './driver-delivery-map.scss',
})
export class DriverDeliveryMap implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer')
  private mapContainer?: ElementRef<HTMLDivElement>

  driverPosition = input<DriverPosition | null>(null)
  destination = input<DeliveryDestinationModel | null>(null)

  statusLabel = input<string>('Statut')
  statusSeverity = input<TagSeverity>('secondary')

  private map?: L.Map
  private driverMarker?: L.Marker
  private destinationMarker?: L.Marker
  private previewLine?: L.Polyline

  private viewReady = false
  private readonly defaultCenter: L.LatLngExpression = [33.5731, -7.5898]

  constructor() {
    effect(() => {
      this.driverPosition()
      this.destination()

      if (this.viewReady) {
        this.renderMapAfterDomUpdate()
      }
    })
  }

  ngAfterViewInit(): void {
    this.viewReady = true
    this.renderMapAfterDomUpdate()
  }

  ngOnDestroy(): void {
    this.map?.remove()
    this.map = undefined
  }

  private renderMapAfterDomUpdate(): void {
    setTimeout(() => {
      this.renderMap()
      setTimeout(() => this.map?.invalidateSize(), 100)
    }, 0)
  }

  private renderMap(): void {
    if (!this.ensureMap()) return

    const destination = this.destination()
    const driverPosition = this.driverPosition()

    if (this.hasCoordinates(destination)) {
      this.destinationMarker = this.upsertMarker(
        this.destinationMarker,
        destination,
        'Destination client',
        'destination',
      )
    }

    if (this.hasCoordinates(driverPosition)) {
      this.driverMarker = this.upsertMarker(
        this.driverMarker,
        driverPosition,
        'Votre position',
        'driver',
      )
    }

    this.updatePreviewLine()
    this.fitMapToVisibleMarkers()
  }

  private ensureMap(): boolean {
    const element = this.mapContainer?.nativeElement

    if (!element) return false

    if (this.map) {
      this.map.invalidateSize()
      return true
    }

    this.map = L.map(element).setView(this.getInitialMapCenter(), 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map)

    return true
  }

  private getInitialMapCenter(): L.LatLngExpression {
    const driverPosition = this.driverPosition()
    const destination = this.destination()

    if (this.hasCoordinates(driverPosition)) {
      return [driverPosition.latitude, driverPosition.longitude]
    }

    if (this.hasCoordinates(destination)) {
      return [destination.latitude, destination.longitude]
    }

    return this.defaultCenter
  }

  private upsertMarker(
    marker: L.Marker | undefined,
    position: { latitude: number; longitude: number },
    popupText: string,
    type: 'driver' | 'destination',
  ): L.Marker {
    const latLng: L.LatLngExpression = [position.latitude, position.longitude]
    const icon = this.createMarkerIcon(type)

    if (marker) {
      marker.setLatLng(latLng)
      marker.setIcon(icon)
      marker.bindPopup(popupText)
      return marker
    }

    return L.marker(latLng, { icon }).addTo(this.map!).bindPopup(popupText)
  }

  private createMarkerIcon(type: 'driver' | 'destination'): L.DivIcon {
    const markerClass =
      type === 'driver'
        ? 'smartlog-marker smartlog-marker-driver'
        : 'smartlog-marker smartlog-marker-destination'

    const iconHtml =
      type === 'driver' ? '<i class="pi pi-user"></i>' : '<i class="pi pi-map-marker"></i>'

    return L.divIcon({
      className: '',
      html: `<div class="${markerClass}">${iconHtml}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    })
  }

  private updatePreviewLine(): void {
    if (!this.map || !this.driverMarker || !this.destinationMarker) {
      this.previewLine?.remove()
      this.previewLine = undefined
      return
    }

    const driver = this.driverMarker.getLatLng()
    const destination = this.destinationMarker.getLatLng()

    const points: L.LatLngExpression[] = [
      [driver.lat, driver.lng],
      [destination.lat, destination.lng],
    ]

    if (this.previewLine) {
      this.previewLine.setLatLngs(points)
      return
    }

    this.previewLine = L.polyline(points).addTo(this.map)
  }

  private fitMapToVisibleMarkers(): void {
    if (!this.map) return

    const points: L.LatLngExpression[] = []

    if (this.destinationMarker) {
      const position = this.destinationMarker.getLatLng()
      points.push([position.lat, position.lng])
    }

    if (this.driverMarker) {
      const position = this.driverMarker.getLatLng()
      points.push([position.lat, position.lng])
    }

    if (points.length === 1) {
      this.map.setView(points[0], 14)
      return
    }

    if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), {
        padding: [40, 40],
      })
    }
  }

  private hasCoordinates(
    value: { latitude?: number | null; longitude?: number | null } | null | undefined,
  ): value is { latitude: number; longitude: number } {
    return value?.latitude != null && value?.longitude != null
  }
}
