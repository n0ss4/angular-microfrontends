import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  OidcTokenResponse,
  OidcDiscoveryDoc,
  User,
  UserClaims
} from '../models';

/**
 * Mock OIDC Provider Service
 *
 * Simula un Identity Provider (IdP) completo tipo Auth0, Keycloak, o Azure AD
 *
 * En producción, esto sería reemplazado por llamadas HTTP reales a un IdP.
 * Este mock es útil para desarrollo y testing.
 */
@Injectable({
  providedIn: 'root'
})
export class MockOidcProviderService {

  private readonly ISSUER = 'http://localhost:4200/mock-idp';
  private readonly CLIENT_ID = 'angular-microfrontends-client';

  // Base de datos simulada de usuarios
  private mockUsers: Array<{ username: string; password: string; userData: User }> = [
    {
      username: 'admin@example.com',
      password: 'admin123',
      userData: {
        sub: 'user-001',
        email: 'admin@example.com',
        name: 'Admin User',
        given_name: 'Admin',
        family_name: 'User',
        preferred_username: 'admin',
        picture: 'https://i.pravatar.cc/150?img=1',
        roles: ['admin', 'user'],
        email_verified: true
      }
    },
    {
      username: 'manager@example.com',
      password: 'manager123',
      userData: {
        sub: 'user-002',
        email: 'manager@example.com',
        name: 'Manager User',
        given_name: 'Manager',
        family_name: 'User',
        preferred_username: 'manager',
        picture: 'https://i.pravatar.cc/150?img=2',
        roles: ['manager', 'user'],
        email_verified: true
      }
    },
    {
      username: 'user@example.com',
      password: 'user123',
      userData: {
        sub: 'user-003',
        email: 'user@example.com',
        name: 'Regular User',
        given_name: 'Regular',
        family_name: 'User',
        preferred_username: 'user',
        picture: 'https://i.pravatar.cc/150?img=3',
        roles: ['user'],
        email_verified: true
      }
    }
  ];

  // Almacenamiento temporal de códigos de autorización
  private authorizationCodes = new Map<string, {
    user: User;
    scope: string;
    expiresAt: number;
    nonce?: string;
  }>();

  // Almacenamiento temporal de refresh tokens
  private refreshTokens = new Map<string, {
    user: User;
    expiresAt: number;
  }>();

  /**
   * Obtiene el documento de descubrimiento OIDC
   * Equivalente a GET /.well-known/openid-configuration
   */
  getDiscoveryDocument(): Observable<OidcDiscoveryDoc> {
    return of({
      issuer: this.ISSUER,
      authorization_endpoint: `${this.ISSUER}/authorize`,
      token_endpoint: `${this.ISSUER}/token`,
      userinfo_endpoint: `${this.ISSUER}/userinfo`,
      end_session_endpoint: `${this.ISSUER}/logout`,
      jwks_uri: `${this.ISSUER}/jwks`,

      response_types_supported: ['code', 'code id_token', 'token id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],
      scopes_supported: ['openid', 'profile', 'email', 'roles'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      claims_supported: [
        'sub', 'iss', 'aud', 'exp', 'iat', 'auth_time',
        'name', 'given_name', 'family_name', 'email', 'email_verified',
        'preferred_username', 'picture', 'roles'
      ],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256', 'plain']
    }).pipe(delay(100)); // Simular latencia de red
  }

  /**
   * Autentica al usuario y genera un código de autorización
   * Simula el login form del IdP
   */
  authenticateUser(username: string, password: string, scope: string, nonce?: string): Observable<string> {
    // Simular latencia de red
    return of(null).pipe(
      delay(500),
      switchMap(() => {
        const mockUser = this.mockUsers.find(
          u => u.username === username && u.password === password
        );

        if (!mockUser) {
          return throwError(() => new Error('Invalid credentials'));
        }

        // Generar código de autorización
        const code = this.generateRandomString(32);
        const expiresAt = Date.now() + (10 * 60 * 1000); // Expira en 10 minutos

        this.authorizationCodes.set(code, {
          user: mockUser.userData,
          scope,
          expiresAt,
          nonce
        });

        return of(code);
      })
    );
  }

  /**
   * Intercambia el authorization code por tokens
   * Simula el token endpoint: POST /token
   */
  exchangeCodeForTokens(code: string, clientId: string): Observable<OidcTokenResponse> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const authData = this.authorizationCodes.get(code);

        if (!authData) {
          return throwError(() => new Error('Invalid or expired authorization code'));
        }

        if (authData.expiresAt < Date.now()) {
          this.authorizationCodes.delete(code);
          return throwError(() => new Error('Authorization code expired'));
        }

        if (clientId !== this.CLIENT_ID) {
          return throwError(() => new Error('Invalid client_id'));
        }

        // Eliminar el código (one-time use)
        this.authorizationCodes.delete(code);

        // Generar tokens
        const accessToken = this.generateAccessToken(authData.user, authData.scope);
        const idToken = this.generateIdToken(authData.user, clientId, authData.nonce);
        const refreshToken = this.generateRefreshToken(authData.user);

        return of({
          access_token: accessToken,
          id_token: idToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 3600, // 1 hora
          scope: authData.scope
        });
      })
    );
  }

  /**
   * Renueva los tokens usando el refresh token
   * Simula el token endpoint con grant_type=refresh_token
   */
  refreshAccessToken(refreshToken: string): Observable<OidcTokenResponse> {
    return of(null).pipe(
      delay(300),
      switchMap(() => {
        const tokenData = this.refreshTokens.get(refreshToken);

        if (!tokenData) {
          return throwError(() => new Error('Invalid refresh token'));
        }

        if (tokenData.expiresAt < Date.now()) {
          this.refreshTokens.delete(refreshToken);
          return throwError(() => new Error('Refresh token expired'));
        }

        // Generar nuevos tokens
        const accessToken = this.generateAccessToken(tokenData.user, 'openid profile email roles');
        const idToken = this.generateIdToken(tokenData.user, this.CLIENT_ID);
        const newRefreshToken = this.generateRefreshToken(tokenData.user);

        // Eliminar el refresh token viejo
        this.refreshTokens.delete(refreshToken);

        return of({
          access_token: accessToken,
          id_token: idToken,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile email roles'
        });
      })
    );
  }

  /**
   * Obtiene información del usuario desde el access token
   * Simula el userinfo endpoint: GET /userinfo
   */
  getUserInfo(accessToken: string): Observable<UserClaims> {
    return of(null).pipe(
      delay(200),
      switchMap(() => {
        const claims = this.decodeAccessToken(accessToken);

        if (!claims) {
          return throwError(() => new Error('Invalid access token'));
        }

        const user = this.mockUsers.find(u => u.userData.sub === claims.sub);

        if (!user) {
          return throwError(() => new Error('User not found'));
        }

        const userClaims: UserClaims = {
          ...user.userData,
          iss: this.ISSUER,
          aud: this.CLIENT_ID,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          auth_time: Math.floor(Date.now() / 1000)
        };

        return of(userClaims);
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   * Simula el end_session endpoint
   */
  endSession(idToken: string): Observable<void> {
    return of(null).pipe(
      delay(200),
      switchMap(() => {
        // En un IdP real, aquí se invalidarían las sesiones
        // Por ahora solo simulamos el delay
        return of(void 0);
      })
    );
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Genera un JWT simulado para el access token
   */
  private generateAccessToken(user: User, scope: string): string {
    const header = { alg: 'RS256', typ: 'JWT', kid: 'key-1' };
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: this.ISSUER,
      sub: user.sub,
      aud: 'api://microfrontends',
      exp: now + 3600,
      iat: now,
      scope: scope,
      email: user.email,
      roles: user.roles
    };

    return this.createMockJWT(header, payload);
  }

  /**
   * Genera un JWT simulado para el id token
   */
  private generateIdToken(user: User, clientId: string, nonce?: string): string {
    const header = { alg: 'RS256', typ: 'JWT', kid: 'key-1' };
    const now = Math.floor(Date.now() / 1000);

    const payload: any = {
      iss: this.ISSUER,
      sub: user.sub,
      aud: clientId,
      exp: now + 3600,
      iat: now,
      auth_time: now,
      name: user.name,
      given_name: user.given_name,
      family_name: user.family_name,
      email: user.email,
      email_verified: user.email_verified,
      preferred_username: user.preferred_username,
      picture: user.picture,
      roles: user.roles
    };

    if (nonce) {
      payload.nonce = nonce;
    }

    return this.createMockJWT(header, payload);
  }

  /**
   * Genera un refresh token
   */
  private generateRefreshToken(user: User): string {
    const token = this.generateRandomString(64);
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días

    this.refreshTokens.set(token, {
      user,
      expiresAt
    });

    return token;
  }

  /**
   * Crea un JWT mock (NO ES SEGURO - solo para desarrollo)
   */
  private createMockJWT(header: any, payload: any): string {
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.generateRandomString(43);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Decodifica un JWT simulado
   */
  private decodeAccessToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(this.base64UrlDecode(parts[1]));

      // Verificar expiración
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Decodifica un ID token JWT
   */
  decodeIdToken(token: string): any {
    return this.decodeAccessToken(token);
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * Genera un string aleatorio seguro
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  }

  /**
   * Obtiene la lista de usuarios mock (solo para testing/demo)
   */
  getMockUsers() {
    return this.mockUsers.map(u => ({
      username: u.username,
      password: u.password,
      roles: u.userData.roles
    }));
  }
}

// Importar switchMap
import { switchMap } from 'rxjs/operators';
