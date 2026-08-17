import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly TOKEN_KEY = 'smartlog_token'

  saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY)
  }

  hasToken(): boolean {
    return !!this.getToken()
  }
}
