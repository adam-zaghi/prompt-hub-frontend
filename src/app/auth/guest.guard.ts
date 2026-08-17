import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { catchError, map, of } from 'rxjs'

import { AuthService } from './auth-service'
import { TokenService } from './TokenService'
import { getHomeUrlByRole } from './role-home'

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService)
  const authService = inject(AuthService)
  const router = inject(Router)

  const token = tokenService.getToken()

  // Aucun token : l'utilisateur peut accéder à /auth
  if (!token) {
    return true
  }

  const currentUser = authService.currentUser()

  // User déjà chargé
  if (currentUser) {
    const homeUrl = getHomeUrlByRole(currentUser.role)

    if (homeUrl) {
      return router.createUrlTree([homeUrl])
    }

    // Rôle inconnu : on évite la boucle
    tokenService.removeToken()
    return true
  }

  // Token présent après refresh : on recharge /me
  return authService.loadCurrentUser().pipe(
    map((user) => {
      if (!user) {
        return true
      }

      const homeUrl = getHomeUrlByRole(user.role)

      if (homeUrl) {
        return router.createUrlTree([homeUrl])
      }

      // Rôle inconnu : on supprime le token et on reste sur /auth
      tokenService.removeToken()
      return true
    }),
    catchError((err) => {
      console.error(err)
      tokenService.removeToken()
      return of(true)
    }),
  )
}
