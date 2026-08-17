import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { catchError, map, of } from 'rxjs'

import { AuthService } from './auth-service'
import { TokenService } from './TokenService'
import { getHomeUrlByRole } from './role-home'

export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const tokenService = inject(TokenService)
  const router = inject(Router)

  const currentUser = authService.currentUser()

  if (currentUser) {
    const homeUrl = getHomeUrlByRole(currentUser.role)

    if (homeUrl) {
      return router.createUrlTree([homeUrl])
    }

    tokenService.removeToken()
    return router.createUrlTree(['/auth'])
  }

  return authService.loadCurrentUser().pipe(
    map((user) => {
      if (!user) {
        tokenService.removeToken()
        return router.createUrlTree(['/auth'])
      }

      const homeUrl = getHomeUrlByRole(user.role)

      if (homeUrl) {
        return router.createUrlTree([homeUrl])
      }

      tokenService.removeToken()
      return router.createUrlTree(['/auth'])
    }),
    catchError((err) => {
      console.error(err)
      tokenService.removeToken()
      return of(router.createUrlTree(['/auth']))
    }),
  )
}
