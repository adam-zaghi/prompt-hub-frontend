import { Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Card } from 'primeng/card'
import { Button } from 'primeng/button'
import { Password } from 'primeng/password'
import { InputText } from 'primeng/inputtext'
import { AuthService } from '../auth-service'
import { DataUser } from '../DataUser'
import { Router } from '@angular/router'
import { createUserRequest } from '../createUserRequest'

@Component({
  selector: 'app-auth-form',
  imports: [ReactiveFormsModule, Card, Button, Password, InputText],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
})
export class AuthForm {
  authService = inject(AuthService)
  routeur = inject(Router)

  // login / register
  mode = signal<'login' | 'register'>('login')

  toggleMode() {
    this.mode.update((value) => (value === 'login' ? 'register' : 'login'))
  }

  // =========================
  // LOGIN FORM
  // =========================

  loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
  })

  // =========================
  // REGISTER FORM
  // =========================

  registerForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),

    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  })

  // =========================
  // SUBMIT
  // =========================

  submit() {
    if (this.mode() === 'login') {
      this.loginForm.markAllAsTouched()

      if (this.loginForm.invalid) {
        return
      }

      const data = this.loginForm.getRawValue()

      this.login(data.username, data.password)
    } else {
      this.registerForm.markAllAsTouched()

      if (this.registerForm.invalid) {
        return
      }

      const data = this.registerForm.getRawValue()

      this.register(data)
    }
  }

  login(username: string, password: string) {
    this.authService.login(username, password).subscribe(() => void this.routeur.navigate(['/']))
  }

  register(data: createUserRequest) {
    this.authService.register(data).subscribe(() => void this.routeur.navigate(['/']))
  }
}
