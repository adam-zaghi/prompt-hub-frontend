import { CommonModule } from '@angular/common'
import {  Component, OnInit, inject, signal } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { catchError, finalize, forkJoin, Observable, of, switchMap } from 'rxjs'

import { CardModule } from 'primeng/card'
import { ButtonModule } from 'primeng/button'
import { TagModule } from 'primeng/tag'
import { SkeletonModule } from 'primeng/skeleton'
import { DriverDeliveryMap, DriverPosition } from '../driver-delivery-map/driver-delivery-map'

import { DeliveryAssignmentService } from '../../deliveries/delivery-assignment.service'
import { DeliveryAssignmentModel, DeliveryStatus } from '../../deliveries/delivery-assignment.model'
import { TrackingService } from '../../tracking/tracking.service'
import {
  DeliveryDestinationModel,
  DeliveryEstimateModel,
  TrackingEventModel,
  UpdatePositionRequest,
} from '../../tracking/tracking.model'

type TagSeverity = 'success' | 'info' | 'danger' | 'secondary' | 'warn' | 'contrast'



@Component({
  selector: 'app-driver-delivery-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    DriverDeliveryMap,
  ],
  templateUrl: './driver-delivery-detail.html',
  styleUrl: './driver-delivery-detail.scss',
})
export class DriverDeliveryDetail implements OnInit {
  private route = inject(ActivatedRoute)
  private deliveryAssignmentService = inject(DeliveryAssignmentService)
  private trackingService = inject(TrackingService)

  assignmentId!: number
  estimate = signal<DeliveryEstimateModel | null>(null)
  loading = signal(true)
  actionLoading = signal(false)
  positionLoading = signal(false)

  errorMessage = signal('')
  successMessage = signal('')

  assignment = signal<DeliveryAssignmentModel | null>(null)
  destination = signal<DeliveryDestinationModel | null>(null)
  lastPosition = signal<TrackingEventModel | null>(null)

  /**
   * Position utilisée uniquement pour l’affichage sur la carte.
   *
   * Avant Start :
   * - position locale du livreur
   * - non sauvegardée
   * - invisible côté client
   *
   * Après Start :
   * - position envoyée au backend
   * - visible côté client
   */
  driverPosition = signal<DriverPosition | null>(null)

  ngOnInit(): void {
    this.assignmentId = Number(this.route.snapshot.paramMap.get('id'))

    if (!this.assignmentId) {
      this.loading.set(false)
      this.errorMessage.set('Livraison introuvable.')
      return
    }

    this.loadAssignment()
  }

  loadAssignment(): void {
    this.loading.set(true)
    this.clearMessages()

    this.deliveryAssignmentService
      .getAssignmentById(this.assignmentId)
      .pipe(
        switchMap((assignment) => {
          this.assignment.set(assignment)

          return forkJoin({
            lastPosition: this.trackingService
              .getLastPosition(assignment.parcelId)
              .pipe(catchError(() => of(null))),

            destination: this.trackingService
              .getParcelDestination(assignment.parcelId)
              .pipe(catchError(() => of(null))),

            estimate: this.trackingService
              .getParcelEstimate(assignment.parcelId)
              .pipe(catchError(() => of(null))),
          })
        }),
      )
      .subscribe({
        next: ({ lastPosition, destination, estimate }) => {
          this.lastPosition.set(lastPosition)
          this.destination.set(destination)
          this.estimate.set(estimate)

          if (this.hasCoordinates(lastPosition)) {
            this.driverPosition.set({
              latitude: lastPosition.latitude,
              longitude: lastPosition.longitude,
              accuracy: lastPosition.accuracy,
            })
          }

          this.loading.set(false)
        },
        error: (err) => {
          console.error(err)
          this.loading.set(false)
          this.errorMessage.set(
            err?.error?.message || err?.error || 'Impossible de charger la livraison.',
          )
        },
      })
  }
  private loadEstimate(parcelId: number): void {
    this.trackingService
      .getParcelEstimate(parcelId)
      .pipe(catchError(() => of(null)))
      .subscribe((estimate) => {
        this.estimate.set(estimate)
      })
  }
  async showMyPositionOnMap(): Promise<void> {
    if (!this.canUseGeolocation()) return

    this.positionLoading.set(true)
    this.clearMessages()

    try {
      const position = await this.getCurrentBrowserPosition()

      this.driverPosition.set(position)

      this.successMessage.set(
        'Position affichée sur la carte. Elle n’est pas encore envoyée au client.',
      )
    } catch (err) {
      console.error(err)
      this.errorMessage.set(this.getGeolocationErrorMessage(err))
    } finally {
      this.positionLoading.set(false)
    }
  }

  async sendCurrentPosition(): Promise<void> {
    const currentAssignment = this.assignment()

    if (!currentAssignment || currentAssignment.status !== 'IN_PROGRESS') return
    if (!this.canUseGeolocation()) return

    this.positionLoading.set(true)

    this.clearMessages()

    try {
      const browserPosition = await this.getCurrentBrowserPosition()

      const request: UpdatePositionRequest = {
        parcelId: currentAssignment.parcelId,
        deliveryAssignmentId: currentAssignment.id,
        deliveryAgentId: currentAssignment.agent?.id,
        latitude: browserPosition.latitude,
        longitude: browserPosition.longitude,
        accuracy: browserPosition.accuracy ?? undefined,
        speed: browserPosition.speed ?? undefined,
        locationLabel: 'Position livreur',
        description: 'Position envoyée depuis l’espace livreur',
      }

      this.trackingService
        .updatePosition(request)
        .pipe(finalize(() => this.positionLoading.set(false)))
        .subscribe({
          next: (trackingEvent) => {
            this.lastPosition.set(trackingEvent)

            this.driverPosition.set({
              latitude: trackingEvent.latitude,
              longitude: trackingEvent.longitude,
              accuracy: trackingEvent.accuracy,
            })
            this.loadEstimate(currentAssignment.parcelId)
            this.successMessage.set('Position envoyée avec succès. Le client peut la voir.')
          },
          error: (err) => {
            console.error(err)
            this.errorMessage.set(
              err?.error?.message || err?.error || 'Impossible d’envoyer la position.',
            )
          },
        })
    } catch (err) {
      console.error(err)
      this.positionLoading.set(false)
      this.errorMessage.set(this.getGeolocationErrorMessage(err))
    }
  }

  startDelivery(): void {
    const currentAssignment = this.assignment()

    if (!currentAssignment || currentAssignment.status !== 'ASSIGNED') return

    this.runAssignmentAction(
      this.deliveryAssignmentService.startDelivery(currentAssignment.id),
      'Livraison démarrée. Le client peut maintenant suivre le colis.',
    )
  }
  formatDistance(meters?: number | null): string {
    if (meters == null) return '-'

    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }

    return `${(meters / 1000).toFixed(1)} km`
  }

  formatDuration(seconds?: number | null): string {
    if (seconds == null) return '-'

    const minutes = Math.round(seconds / 60)

    if (minutes < 60) {
      return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    return `${hours}h ${remainingMinutes}min`
  }

  getDelayLabel(): string {
    const currentEstimate = this.estimate()

    if (!currentEstimate?.updatedAt && currentEstimate?.remainingDistanceMeters == null) {
      return 'Non calculé'
    }

    return currentEstimate.delayed ? 'En retard' : 'À l’heure'
  }

  getDelaySeverity(): TagSeverity {
    const currentEstimate = this.estimate()

    if (!currentEstimate?.updatedAt && currentEstimate?.remainingDistanceMeters == null) {
      return 'secondary'
    }

    return currentEstimate.delayed ? 'danger' : 'success'
  }
  completeDelivery(): void {
    const currentAssignment = this.assignment()

    if (!currentAssignment || currentAssignment.status !== 'IN_PROGRESS') return

    this.runAssignmentAction(
      this.deliveryAssignmentService.completeDelivery(currentAssignment.id),
      'Livraison terminée avec succès.',
    )
  }

  failDelivery(): void {
    const currentAssignment = this.assignment()

    if (!currentAssignment || currentAssignment.status !== 'IN_PROGRESS') return

    const notes = prompt('Indiquez la raison de l’échec de livraison :')

    if (!notes?.trim()) return

    this.runAssignmentAction(
      this.deliveryAssignmentService.failDelivery(currentAssignment.id, notes.trim()),
      'Échec de livraison signalé.',
    )
  }

  private runAssignmentAction(
    action$: Observable<DeliveryAssignmentModel>,
    successMessage: string,
  ): void {
    this.actionLoading.set(true)
    this.clearMessages()

    action$.pipe(finalize(() => this.actionLoading.set(false))).subscribe({
      next: (updatedAssignment) => {
        this.assignment.set(updatedAssignment)
        this.successMessage.set(successMessage)
      },
      error: (err) => {
        console.error(err)
        this.errorMessage.set(
          err?.error?.message || err?.error || 'Action impossible pour cette livraison.',
        )
      },
    })
  }

  canPreviewPosition(): boolean {
    return this.assignment()?.status === 'ASSIGNED'
  }

  canStart(): boolean {
    return this.assignment()?.status === 'ASSIGNED'
  }

  canSendPosition(): boolean {
    return this.assignment()?.status === 'IN_PROGRESS'
  }

  canComplete(): boolean {
    return this.assignment()?.status === 'IN_PROGRESS'
  }

  canFail(): boolean {
    return this.assignment()?.status === 'IN_PROGRESS'
  }

  getStatusLabel(status?: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      ASSIGNED: 'Assignée',
      IN_PROGRESS: 'En cours',
      DELIVERED: 'Livrée',
      FAILED: 'Échec',
      CANCELLED: 'Annulée',
    }

    return status ? (labels[status] ?? status) : '-'
  }

  getStatusSeverity(status?: DeliveryStatus): TagSeverity {
    const severities: Record<DeliveryStatus, TagSeverity> = {
      ASSIGNED: 'info',
      IN_PROGRESS: 'warn',
      DELIVERED: 'success',
      FAILED: 'danger',
      CANCELLED: 'danger',
    }

    return status ? (severities[status] ?? 'secondary') : 'secondary'
  }

  private clearMessages(): void {
    this.errorMessage.set('')
    this.successMessage.set('')
  }

  private canUseGeolocation(): boolean {
    if (navigator.geolocation) return true

    this.errorMessage.set('La géolocalisation n’est pas supportée par ce navigateur.')
    return false
  }

  private getCurrentBrowserPosition(): Promise<DriverPosition> {
    return this.tryGetPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }).catch((firstError) => {
      console.warn('High accuracy geolocation failed, retrying with low accuracy', firstError)

      return this.tryGetPosition({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
      })
    })
  }
  private getGeolocationErrorMessage(error: unknown): string {
    const geoError = error as GeolocationPositionError

    switch (geoError.code) {
      case 1:
        return 'Permission GPS refusée. Autorisez la localisation dans le navigateur.'
      case 2:
        return 'Position indisponible. Vérifiez votre connexion ou le service de localisation.'
      case 3:
        return 'Délai dépassé. Le navigateur n’a pas réussi à récupérer votre position.'
      default:
        return 'Impossible de récupérer votre position.'
    }
  }
  private tryGetPosition(options: PositionOptions): Promise<DriverPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
          })
        },
        (error) => reject(error),
        options,
      )
    })
  }
  private hasCoordinates(
    value: { latitude?: number | null; longitude?: number | null } | null | undefined,
  ): value is { latitude: number; longitude: number } {
    return value?.latitude != null && value?.longitude != null
  }
}
