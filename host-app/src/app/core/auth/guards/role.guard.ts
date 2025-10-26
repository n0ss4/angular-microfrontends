import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role Guard - Protege rutas basándose en roles del usuario
 *
 * Uso con data.roles (requiere TODOS los roles):
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['admin'] }
 * }
 *
 * Uso con data.anyRole (requiere AL MENOS UNO de los roles):
 * {
 *   path: 'management',
 *   component: ManagementComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { anyRole: ['admin', 'manager'] }
 * }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Primero verificar que esté autenticado
  if (!authService.isAuthenticated()) {
    console.warn('⛔ [RoleGuard] Usuario no autenticado');
    sessionStorage.setItem('auth_return_url', state.url);
    router.navigate(['/login']);
    return false;
  }

  // Obtener roles requeridos de la ruta
  const requiredRoles = route.data['roles'] as string[] | undefined;
  const anyRole = route.data['anyRole'] as string[] | undefined;

  // Si no hay roles especificados, permitir acceso
  if (!requiredRoles && !anyRole) {
    console.log('✅ [RoleGuard] No hay roles requeridos, permitiendo acceso');
    return true;
  }

  // Verificar roles (requiere TODOS)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAllRoles = authService.hasAllRoles(requiredRoles);

    if (hasAllRoles) {
      console.log(`✅ [RoleGuard] Usuario tiene todos los roles requeridos: ${requiredRoles.join(', ')}`);
      return true;
    } else {
      console.warn(`⛔ [RoleGuard] Usuario NO tiene todos los roles requeridos: ${requiredRoles.join(', ')}`);
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  // Verificar anyRole (requiere AL MENOS UNO)
  if (anyRole && anyRole.length > 0) {
    const hasAnyRole = authService.hasAnyRole(anyRole);

    if (hasAnyRole) {
      console.log(`✅ [RoleGuard] Usuario tiene al menos uno de los roles: ${anyRole.join(', ')}`);
      return true;
    } else {
      console.warn(`⛔ [RoleGuard] Usuario NO tiene ninguno de los roles: ${anyRole.join(', ')}`);
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return false;
};

/**
 * Admin Guard - Protege rutas que solo pueden acceder administradores
 * Shortcut conveniente para roleGuard con role 'admin'
 *
 * Uso:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, adminGuard]
 * }
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('auth_return_url', state.url);
    router.navigate(['/login']);
    return false;
  }

  if (authService.hasRole('admin')) {
    console.log('✅ [AdminGuard] Usuario es admin, permitiendo acceso');
    return true;
  }

  console.warn('⛔ [AdminGuard] Usuario NO es admin');
  router.navigate(['/unauthorized']);
  return false;
};
