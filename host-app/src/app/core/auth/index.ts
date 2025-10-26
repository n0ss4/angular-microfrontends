/**
 * Barrel export principal para el módulo de autenticación
 *
 * Este archivo expone todos los componentes del sistema de autenticación OIDC
 * para que puedan ser importados fácilmente tanto en el host como en los microfrontends.
 */

// Services
export * from './services/auth.service';
export * from './services/mock-oidc-provider.service';

// Guards
export * from './guards';

// Interceptors
export * from './interceptors';

// Models
export * from './models';
