const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({

  name: 'host-app',

  // Exponer módulos de autenticación para que los MFEs puedan importarlos
  exposes: {
    // Servicio principal de autenticación
    './AuthService': './src/app/core/auth/services/auth.service.ts',

    // Guards
    './AuthGuard': './src/app/core/auth/guards/auth.guard.ts',
    './RoleGuard': './src/app/core/auth/guards/role.guard.ts',

    // Interceptors
    './AuthInterceptor': './src/app/core/auth/interceptors/auth.interceptor.ts',

    // Mock Provider (opcional - solo para desarrollo)
    './MockOidcProvider': './src/app/core/auth/services/mock-oidc-provider.service.ts',

    // Modelos
    './AuthModels': './src/app/core/auth/models/index.ts',

    // Barrel export completo
    './Auth': './src/app/core/auth/index.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    /^@module-federation/,
    // Add further packages you don't need at runtime
  ]

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

});
