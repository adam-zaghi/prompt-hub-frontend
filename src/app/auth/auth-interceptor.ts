import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { TokenService } from './TokenService'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService)
  const token = tokenService.getToken()

  if (!token) {
    return next(req)
  }

  //si on a la requette on la clone on lui donne Authorization: `Bearer ${token}` en header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  })

  return next(authReq)
}
