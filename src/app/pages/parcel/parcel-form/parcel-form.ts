import { AsyncPipe } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { Card } from 'primeng/card'
import { Button } from 'primeng/button'
import { InputText } from 'primeng/inputtext'

import { ParcelService } from '../parcel.service'
import { CreateParcelRequest } from '../create-parcel-request.model'
import { ParcelPriority } from '../parcel.model'

@Component({
  selector: 'app-parcel-form',
  imports: [ReactiveFormsModule, AsyncPipe, Card, Button, InputText, RouterLink],
  templateUrl: './parcel-form.html',
  styleUrl: './parcel-form.scss',
})
export class ParcelForm implements OnInit {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private parcelService = inject(ParcelService)

  orderId!: number

  priorities: ParcelPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

  form = new FormGroup({
    weight: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.1)],
    }),
    height: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    width: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    length: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    fragile: new FormControl(false),
    insured: new FormControl(false),
    priority: new FormControl<ParcelPriority>('NORMAL', {
      validators: [Validators.required],
    }),
  })

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('orderId'))
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const value = this.form.value

    const request: CreateParcelRequest = {
      orderId: this.orderId,

      weight: value.weight!,
      height: value.height!,
      width: value.width!,
      length: value.length!,

      fragile: value.fragile ?? false,
      insured: value.insured ?? false,

      priority: value.priority ?? 'NORMAL',

    }

    this.parcelService.createParcel(request).subscribe({
      next: () => {
        this.router.navigateByUrl(`/orders/${this.orderId}`)
      },
      error: (err) => {
        console.error('Erreur création colis', err)
      },
    })
  }
}
