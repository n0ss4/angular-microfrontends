import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protege rutas que requieren autenticación
 *
 * Uso:
 * {
 *   path: 'protected',
 *   component: ProtectedComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('✅ [AuthGuard] Usuario autenticado, permitiendo acceso');
    return true;
  }

  console.warn('⛔ [AuthGuard] Usuario no autenticado, redirigiendo a login');

  // Guardar la URL intentada para redireccionar después del login
  sessionStorage.setItem('auth_return_url', state.url);

  // Redireccionar a login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

/**
 * Guest Guard - Protege rutas que solo pueden acceder usuarios NO autenticados
 * Por ejemplo: login, registro
 *
 * Uso:
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('✅ [GuestGuard] Usuario no autenticado, permitiendo acceso');
    return true;
  }

  console.warn('⛔ [GuestGuard] Usuario ya autenticado, redirigiendo a home');

  // Usuario ya autenticado, redireccionar a home
  router.navigate(['/mfe1']);

  return false;
};
