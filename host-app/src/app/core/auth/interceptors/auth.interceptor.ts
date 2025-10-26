import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Auth Interceptor - Intercepta peticiones HTTP para añadir el access token
 *
 * Funcionalidades:
 * - Añade el Authorization header con el Bearer token
 * - Maneja errores 401 (Unauthorized) intentando renovar el token
 * - Excluye endpoints públicos que no requieren autenticación
 *
 * Uso en app.config.ts:
 * provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Lista de URLs que no requieren autenticación
  const publicEndpoints = [
    '/mock-idp/',
    '/assets/',
    '/auth/',
    '/login',
    '/register'
  ];

  // Verificar si la petición es a un endpoint público
  const isPublicEndpoint = publicEndpoints.some(endpoint =>
    req.url.includes(endpoint)
  );

  // Si es endpoint público, continuar sin modificar
  if (isPublicEndpoint) {
    return next(req);
  }

  // Obtener el access token
  const accessToken = authService.getAccessToken();

  // Si no hay token y no es público, continuar sin modificar
  // (el backend responderá con 401 si es necesario)
  if (!accessToken) {
    return next(req);
  }

  // Clonar la petición y añadir el Authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  console.log(`🔒 [AuthInterceptor] Añadiendo token a: ${req.method} ${req.url}`);

  // Continuar con la petición modificada y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 (Unauthorized), intentar renovar el token
      if (error.status === 401) {
        console.warn('⚠️ [AuthInterceptor] Error 401 - Intentando renovar token...');

        return authService.refreshToken().pipe(
          switchMap(() => {
            // Token renovado, reintentar la petición original con el nuevo token
            const newToken = authService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });

            console.log('✅ [AuthInterceptor] Token renovado, reintentando petición');
            return next(retryReq);
          }),
          catchError(refreshError => {
            // No se pudo renovar el token, cerrar sesión
            console.error('❌ [AuthInterceptor] No se pudo renovar el token, cerrando sesión');
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Para otros errores, simplemente propagarlos
      return throwError(() => error);
    })
  );
};

/**
 * Error Interceptor - Intercepta errores HTTP globales
 *
 * Maneja errores comunes:
 * - 401: Unauthorized (ya manejado por authInterceptor)
 * - 403: Forbidden
 * - 500: Server Error
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocurrió un error desconocido';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
        console.error('❌ [ErrorInterceptor] Error del cliente:', errorMessage);
      } else {
        // Error del lado del servidor
        switch (error.status) {
          case 401:
            errorMessage = 'No autorizado. Por favor, inicie sesión.';
            break;
          case 403:
            errorMessage = 'Acceso denegado. No tiene permisos suficientes.';
            router.navigate(['/unauthorized']);
            break;
          case 404:
            errorMessage = 'Recurso no encontrado.';
            break;
          case 500:
            errorMessage = 'Error interno del servidor.';
            break;
          case 503:
            errorMessage = 'Servicio no disponible. Intente más tarde.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
        }

        console.error(`❌ [ErrorInterceptor] Error del servidor:`, {
          status: error.status,
          message: errorMessage,
          url: req.url
        });
      }

      // Retornar el error para que el componente pueda manejarlo
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};
