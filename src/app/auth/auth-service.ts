import { inject, Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError, map, of, tap } from 'rxjs'

import { CurrentUser } from './current-user.model'
import { TokenService } from './TokenService'
import { AuthResponse } from './AuthResponse'
import { createUserRequest } from './createUserRequest'

export interface UserResponse {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  enabled: boolean
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient)
  private tokenService = inject(TokenService)

  private readonly baseUrl = 'http://localhost:8888/AUTH-SERVICE/api/auth'

  currentUser = signal<CurrentUser | undefined>(undefined)

  login(email: string, password: string) {
    return this.httpClient
      .post<AuthResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.tokenService.saveToken(response.token)

          this.currentUser.set({
            userId: response.userId,
            email: response.email,
            role: response.role,
          })
        }),
      )
  }

  register(data: createUserRequest) {
    return this.httpClient
      .post<AuthResponse>(`${this.baseUrl}/register`, data)
      .pipe(
        tap((response) => {
          this.tokenService.saveToken(response.token)

          this.currentUser.set({
            userId: response.userId,
            email: response.email,
            role: response.role,
          })
        }),
      )
  }

  loadCurrentUser() {
    return this.httpClient.get<UserResponse>(`${this.baseUrl}/me`).pipe(
      map((response) => {
        const user: CurrentUser = {
          userId: response.id,
          email: response.email,
          role: response.role,
        }

        return user
      }),
      tap((user) => {
        this.currentUser.set(user)
      }),
      catchError((err) => {
        console.error('loadCurrentUser error:', err)

        this.tokenService.removeToken()
        this.currentUser.set(undefined)

        return of(undefined)
      }),
    )
  }

  logout(): void {
    this.tokenService.removeToken()
    this.currentUser.set(undefined)
  }

  getCurrentRole(): string | null {
    const user = this.currentUser()

    if (user?.role) {
      return user.role
    }

    const token = this.tokenService.getToken()

    if (!token) {
      return null
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))

      return payload.role || payload.authorities?.[0] || null
    } catch (error) {
      console.error('Invalid token', error)
      return null
    }
  }
}
