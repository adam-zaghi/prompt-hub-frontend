import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { catchError, map, of } from 'rxjs'

import { AuthService } from './auth-service'
import { TokenService } from './TokenService'

export const authGuard: CanActivateFn = (_, state) => {
  const tokenService = inject(TokenService)
  const authService = inject(AuthService)
  const router = inject(Router)

  const redirectToAuth = () =>
    router.createUrlTree(['/auth'], {
      queryParams: {
        returnUrl: state.url,
      },
    })

  const token = tokenService.getToken()

  if (!token) {
    return redirectToAuth()
  }

  if (authService.currentUser()) {
    return true
  }

  return authService.loadCurrentUser().pipe(
    map((currentUser) => {
      if (currentUser) {
        return true
      }

      tokenService.removeToken()
      return redirectToAuth()
    }),
    catchError((err) => {
      console.error(err)
      tokenService.removeToken()
      return of(redirectToAuth())
    }),
  )
}
