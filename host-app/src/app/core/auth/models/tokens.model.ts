/**
 * OIDC Token Response - Respuesta del token endpoint
 */
export interface OidcTokenResponse {
  access_token: string;      // Token de acceso para APIs
  id_token: string;          // Token de identidad JWT
  refresh_token?: string;    // Token para renovar el access_token
  token_type: string;        // Típicamente "Bearer"
  expires_in: number;        // Segundos hasta expiración
  scope: string;             // Scopes otorgados
}

/**
 * Decoded ID Token - Claims del id_token JWT
 */
export interface IdTokenClaims {
  iss: string;               // Issuer - URL del IdP
  sub: string;               // Subject - ID único del usuario
  aud: string;               // Audience - Client ID
  exp: number;               // Expiration timestamp
  iat: number;               // Issued at timestamp
  auth_time?: number;        // Authentication timestamp
  nonce?: string;            // Nonce para prevenir replay attacks
  acr?: string;              // Authentication Context Class Reference
  amr?: string[];            // Authentication Methods References
  azp?: string;              // Authorized party
}

/**
 * Token Storage - Estructura para almacenar tokens
 */
export interface TokenStorage {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_at: number;        // Timestamp de expiración calculado
  token_type: string;
  scope: string;
}

/**
 * Authorization Request - Parámetros para la solicitud de autorización
 */
export interface AuthorizationRequest {
  response_type: 'code';           // OIDC usa Authorization Code Flow
  client_id: string;
  redirect_uri: string;
  scope: string;                   // e.g., "openid profile email"
  state: string;                   // Random string para prevenir CSRF
  nonce: string;                   // Random string para validar id_token
  code_challenge?: string;         // Para PKCE (Proof Key for Code Exchange)
  code_challenge_method?: string;  // "S256" o "plain"
}

/**
 * Token Request - Parámetros para intercambiar el code por tokens
 */
export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;                   // Authorization code
  redirect_uri?: string;
  client_id: string;
  code_verifier?: string;          // Para PKCE
  refresh_token?: string;          // Para refresh grant
}
