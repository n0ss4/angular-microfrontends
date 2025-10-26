/**
 * OIDC Configuration - Configuración del proveedor OIDC
 */
export interface OidcConfig {
  issuer: string;                    // URL base del IdP
  authorizationEndpoint: string;     // Endpoint de autorización
  tokenEndpoint: string;             // Endpoint de tokens
  userinfoEndpoint: string;          // Endpoint de información del usuario
  endSessionEndpoint: string;        // Endpoint de logout
  jwksUri?: string;                  // JSON Web Key Set URI (para validar firmas)

  clientId: string;                  // ID del cliente
  redirectUri: string;               // URI de redirección después del login
  postLogoutRedirectUri: string;     // URI después del logout

  scope: string;                     // Scopes solicitados (e.g., "openid profile email")
  responseType: 'code';              // Tipo de respuesta (Authorization Code Flow)

  usePkce: boolean;                  // Usar PKCE para mayor seguridad

  // Timeouts y configuración de renovación
  silentRefreshTimeout?: number;     // Tiempo antes de expiración para renovar
  accessTokenExpiringNotificationTime?: number;
}

/**
 * OIDC Discovery Document - Documento de descubrimiento (simulado)
 * En producción, esto vendría de /.well-known/openid-configuration
 */
export interface OidcDiscoveryDoc {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;

  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  grant_types_supported: string[];

  code_challenge_methods_supported?: string[];  // ["plain", "S256"]
}

/**
 * Session State - Estado de la sesión OIDC
 */
export interface SessionState {
  isAuthenticated: boolean;
  user: any | null;
  accessToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  scopes: string[];
}
