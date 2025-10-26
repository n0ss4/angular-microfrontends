/**
 * User Model - Representa la información del usuario autenticado
 */
export interface User {
  sub: string;           // Subject - Identificador único del usuario (OIDC standard)
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  roles: string[];       // Roles del usuario para autorización
  preferred_username: string;
  email_verified: boolean;
}

/**
 * User Claims - Claims adicionales del usuario
 */
export interface UserClaims {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  email_verified: boolean;
  picture?: string;      // URL de la foto del usuario
  roles: string[];
  iss: string;           // Issuer - Quien emitió el token
  aud: string;           // Audience - Para quien es el token
  iat: number;           // Issued At - Timestamp de emisión
  exp: number;           // Expiration - Timestamp de expiración
  auth_time: number;     // Authentication Time
}
