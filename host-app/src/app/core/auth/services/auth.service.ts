import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import { tap, catchError, switchMap, filter, take, map } from 'rxjs/operators';
import { MockOidcProviderService } from './mock-oidc-provider.service';
import {
  User,
  UserClaims,
  OidcConfig,
  TokenStorage,
  OidcTokenResponse,
  SessionState
} from '../models';

/**
 * Auth Service - Servicio principal de autenticación OIDC
 *
 * Maneja todo el flujo de autenticación OpenID Connect:
 * - Authorization Code Flow
 * - Token management (access, id, refresh)
 * - User session
 * - Token refresh automático
 * - Logout
 *
 * Este servicio puede ser compartido con los microfrontends via Module Federation
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private router = inject(Router);
  private mockIdp = inject(MockOidcProviderService);

  // Configuración OIDC
  private readonly config: OidcConfig = {
    issuer: 'http://localhost:4200/mock-idp',
    authorizationEndpoint: 'http://localhost:4200/mock-idp/authorize',
    tokenEndpoint: 'http://localhost:4200/mock-idp/token',
    userinfoEndpoint: 'http://localhost:4200/mock-idp/userinfo',
    endSessionEndpoint: 'http://localhost:4200/mock-idp/logout',

    clientId: 'angular-microfrontends-client',
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200',

    scope: 'openid profile email roles',
    responseType: 'code',

    usePkce: true,
    silentRefreshTimeout: 300, // Renovar 5 minutos antes de expirar
  };

  // Estado de la sesión usando signals (Angular 17+)
  private sessionStateSubject = new BehaviorSubject<SessionState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    expiresAt: null,
    scopes: []
  });

  // Observables públicos
  public sessionState$ = this.sessionStateSubject.asObservable();
  public isAuthenticated$ = this.sessionState$.pipe(
    map(state => state.isAuthenticated)
  );
  public user$ = this.sessionState$.pipe(
    map(state => state.user)
  );

  // Signals para reactive UI
  public isAuthenticatedSignal = signal(false);
  public currentUserSignal = signal<User | null>(null);
  public userRolesSignal = computed(() => this.currentUserSignal()?.roles ?? []);

  // Timer para refresh automático
  private tokenRefreshSubscription: any;

  constructor() {
    this.initializeSession();
  }

  /**
   * Inicializa la sesión desde el storage
   */
  private initializeSession(): void {
    const tokens = this.getStoredTokens();

    if (tokens && tokens.expires_at > Date.now()) {
      // Tokens válidos, restaurar sesión
      this.loadUserInfoFromToken(tokens.id_token)
        .pipe(take(1))
        .subscribe({
          next: () => this.scheduleTokenRefresh(tokens.expires_at),
          error: () => this.clearSession()
        });
    } else {
      this.clearSession();
    }
  }

  /**
   * Inicia el flujo de login (Authorization Code Flow)
   */
  login(username: string, password: string): Observable<void> {
    console.log('🔐 [AuthService] Iniciando login...');

    // Generar state y nonce para seguridad
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    // Guardar state y nonce para validar el callback
    sessionStorage.setItem('oidc_state', state);
    sessionStorage.setItem('oidc_nonce', nonce);

    // Paso 1: Autenticar y obtener authorization code
    return this.mockIdp.authenticateUser(username, password, this.config.scope, nonce).pipe(
      switchMap(code => {
        console.log('✅ [AuthService] Authorization code obtenido');

        // Paso 2: Intercambiar code por tokens
        return this.exchangeCodeForTokens(code);
      }),
      switchMap(tokenResponse => {
        console.log('✅ [AuthService] Tokens obtenidos');

        // Paso 3: Guardar tokens
        this.storeTokens(tokenResponse);

        // Paso 4: Cargar información del usuario
        return this.loadUserInfo();
      }),
      tap(() => {
        console.log('✅ [AuthService] Login completado exitosamente');
      }),
      catchError(error => {
        console.error('❌ [AuthService] Error en login:', error);
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja el callback de autorización
   * Este método se llama en la ruta /auth/callback
   */
  handleAuthCallback(code: string, state: string): Observable<void> {
    console.log('🔄 [AuthService] Procesando callback de autorización...');

    // Validar state para prevenir CSRF
    const storedState = sessionStorage.getItem('oidc_state');
    if (state !== storedState) {
      console.error('❌ [AuthService] State inválido - posible ataque CSRF');
      return throwError(() => new Error('Invalid state parameter'));
    }

    // Limpiar state usado
    sessionStorage.removeItem('oidc_state');

    // Intercambiar code por tokens
    return this.exchangeCodeForTokens(code).pipe(
      switchMap(tokenResponse => {
        this.storeTokens(tokenResponse);
        return this.loadUserInfo();
      }),
      tap(() => {
        console.log('✅ [AuthService] Callback procesado exitosamente');
        // Navegar a la página principal o returnUrl
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        this.router.navigateByUrl(returnUrl);
      })
    );
  }

  /**
   * Intercambia el authorization code por tokens
   */
  private exchangeCodeForTokens(code: string): Observable<OidcTokenResponse> {
    return this.mockIdp.exchangeCodeForTokens(code, this.config.clientId);
  }

  /**
   * Carga la información del usuario desde el access token
   */
  private loadUserInfo(): Observable<void> {
    const tokens = this.getStoredTokens();

    if (!tokens) {
      return throwError(() => new Error('No tokens available'));
    }

    return this.mockIdp.getUserInfo(tokens.access_token).pipe(
      tap(userClaims => {
        const user: User = {
          sub: userClaims.sub,
          email: userClaims.email,
          name: userClaims.name,
          given_name: userClaims.given_name,
          family_name: userClaims.family_name,
          preferred_username: userClaims.preferred_username,
          picture: userClaims.picture,
          roles: userClaims.roles,
          email_verified: userClaims.email_verified
        };

        // Actualizar estado sincrónicamente
        const newState = {
          isAuthenticated: true,
          user,
          accessToken: tokens.access_token,
          idToken: tokens.id_token,
          expiresAt: tokens.expires_at,
          scopes: tokens.scope.split(' ')
        };

        this.sessionStateSubject.next(newState);
        this.isAuthenticatedSignal.set(true);
        this.currentUserSignal.set(user);

        // Programar renovación de token
        this.scheduleTokenRefresh(tokens.expires_at);
      }),
      map(() => void 0)
    );
  }

  /**
   * Carga la información del usuario desde el ID token (método alternativo)
   */
  private loadUserInfoFromToken(idToken: string): Observable<void> {
    const claims = this.mockIdp.decodeIdToken(idToken);

    if (!claims) {
      return throwError(() => new Error('Invalid ID token'));
    }

    const user: User = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      given_name: claims.given_name,
      family_name: claims.family_name,
      preferred_username: claims.preferred_username,
      picture: claims.picture,
      roles: claims.roles,
      email_verified: claims.email_verified
    };

    const tokens = this.getStoredTokens();
    if (tokens) {
      this.updateSessionState({
        isAuthenticated: true,
        user,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        expiresAt: tokens.expires_at,
        scopes: tokens.scope.split(' ')
      });
    }

    return of(void 0);
  }

  /**
   * Renueva el access token usando el refresh token
   */
  refreshToken(): Observable<void> {
    console.log('🔄 [AuthService] Renovando access token...');

    const tokens = this.getStoredTokens();

    if (!tokens || !tokens.refresh_token) {
      console.error('❌ [AuthService] No refresh token disponible');
      return throwError(() => new Error('No refresh token available'));
    }

    return this.mockIdp.refreshAccessToken(tokens.refresh_token).pipe(
      tap(tokenResponse => {
        console.log('✅ [AuthService] Token renovado exitosamente');
        this.storeTokens(tokenResponse);
        this.scheduleTokenRefresh(Date.now() + (tokenResponse.expires_in * 1000));
      }),
      switchMap(() => this.loadUserInfo()),
      catchError(error => {
        console.error('❌ [AuthService] Error renovando token:', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Programa la renovación automática del token
   */
  private scheduleTokenRefresh(expiresAt: number): void {
    // Cancelar refresh anterior si existe
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
    }

    // Calcular cuándo renovar (5 minutos antes de expirar)
    const refreshAt = expiresAt - (this.config.silentRefreshTimeout! * 1000);
    const delay = refreshAt - Date.now();

    if (delay > 0) {
      console.log(`⏰ [AuthService] Token se renovará en ${Math.round(delay / 1000)} segundos`);

      this.tokenRefreshSubscription = timer(delay).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe({
        error: (err) => console.error('Error en refresh automático:', err)
      });
    } else {
      // Token ya expirado o a punto de expirar, renovar inmediatamente
      this.refreshToken().subscribe();
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    console.log('👋 [AuthService] Cerrando sesión...');

    const tokens = this.getStoredTokens();

    // Cancelar refresh automático
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
    }

    // Llamar al endpoint de logout del IdP (opcional)
    if (tokens?.id_token) {
      this.mockIdp.endSession(tokens.id_token).subscribe();
    }

    // Limpiar sesión local
    this.clearSession();

    // Navegar a la página de login
    this.router.navigate(['/login']);

    console.log('✅ [AuthService] Sesión cerrada');
  }

  /**
   * Almacena los tokens en el storage
   */
  private storeTokens(tokenResponse: OidcTokenResponse): void {
    const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

    const tokenStorage: TokenStorage = {
      access_token: tokenResponse.access_token,
      id_token: tokenResponse.id_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: expiresAt,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope
    };

    // Usar sessionStorage para mayor seguridad (se limpia al cerrar el navegador)
    // En producción, considera usar una solución más segura
    sessionStorage.setItem('oidc_tokens', JSON.stringify(tokenStorage));
  }

  /**
   * Obtiene los tokens del storage
   */
  private getStoredTokens(): TokenStorage | null {
    const tokensStr = sessionStorage.getItem('oidc_tokens');
    return tokensStr ? JSON.parse(tokensStr) : null;
  }

  /**
   * Actualiza el estado de la sesión
   */
  private updateSessionState(state: SessionState): void {
    this.sessionStateSubject.next(state);
    this.isAuthenticatedSignal.set(state.isAuthenticated);
    this.currentUserSignal.set(state.user);
  }

  /**
   * Limpia la sesión
   */
  private clearSession(): void {
    sessionStorage.removeItem('oidc_tokens');
    sessionStorage.removeItem('oidc_state');
    sessionStorage.removeItem('oidc_nonce');

    this.updateSessionState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      expiresAt: null,
      scopes: []
    });
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Obtiene el access token
   */
  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.access_token ?? null;
  }

  /**
   * Obtiene el ID token
   */
  getIdToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.id_token ?? null;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const roles = this.userRolesSignal();
    return roles.includes(role);
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.userRolesSignal();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Verifica si el usuario tiene todos los roles especificados
   */
  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.userRolesSignal();
    return roles.every(role => userRoles.includes(role));
  }

  /**
   * Obtiene la configuración OIDC (para debugging)
   */
  getConfig(): OidcConfig {
    return { ...this.config };
  }

  /**
   * Genera un string aleatorio
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  }
}
