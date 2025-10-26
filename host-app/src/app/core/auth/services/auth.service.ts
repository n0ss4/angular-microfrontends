import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import { tap, catchError, switchMap, take, map } from 'rxjs/operators';
import { MockOidcProviderService } from './mock-oidc-provider.service';
import {
  User,
  OidcConfig,
  TokenStorage,
  OidcTokenResponse,
  SessionState
} from '../models';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private router = inject(Router);
  private mockIdp = inject(MockOidcProviderService);

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
    silentRefreshTimeout: 300,
  };

  private sessionStateSubject = new BehaviorSubject<SessionState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    expiresAt: null,
    scopes: []
  });

  public sessionState$ = this.sessionStateSubject.asObservable();
  public isAuthenticated$ = this.sessionState$.pipe(
    map(state => state.isAuthenticated)
  );
  public user$ = this.sessionState$.pipe(
    map(state => state.user)
  );

  public isAuthenticatedSignal = signal(false);
  public currentUserSignal = signal<User | null>(null);
  public userRolesSignal = computed(() => this.currentUserSignal()?.roles ?? []);

  private tokenRefreshSubscription: any;

  constructor() {
    this.initializeSession();
  }

  private initializeSession(): void {
    const tokens = this.getStoredTokens();

    if (tokens && tokens.expires_at > Date.now()) {
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
  login(username: string, password: string): Observable<void> {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);

    sessionStorage.setItem('oidc_state', state);
    sessionStorage.setItem('oidc_nonce', nonce);

    return this.mockIdp.authenticateUser(username, password, this.config.scope, nonce).pipe(
      switchMap(code => this.exchangeCodeForTokens(code)),
      switchMap(tokenResponse => {
        this.storeTokens(tokenResponse);
        return this.loadUserInfo();
      }),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  handleAuthCallback(code: string, state: string): Observable<void> {
    const storedState = sessionStorage.getItem('oidc_state');
    if (state !== storedState) {
      return throwError(() => new Error('Invalid state parameter'));
    }

    sessionStorage.removeItem('oidc_state');

    return this.exchangeCodeForTokens(code).pipe(
      switchMap(tokenResponse => {
        this.storeTokens(tokenResponse);
        return this.loadUserInfo();
      }),
      tap(() => {
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        this.router.navigateByUrl(returnUrl);
      })
    );
  }

  private exchangeCodeForTokens(code: string): Observable<OidcTokenResponse> {
    return this.mockIdp.exchangeCodeForTokens(code, this.config.clientId);
  }
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

        this.scheduleTokenRefresh(tokens.expires_at);
      }),
      map(() => void 0)
    );
  }
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

  refreshToken(): Observable<void> {
    const tokens = this.getStoredTokens();

    if (!tokens || !tokens.refresh_token) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.mockIdp.refreshAccessToken(tokens.refresh_token).pipe(
      tap(tokenResponse => {
        this.storeTokens(tokenResponse);
        this.scheduleTokenRefresh(Date.now() + (tokenResponse.expires_in * 1000));
      }),
      switchMap(() => this.loadUserInfo()),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private scheduleTokenRefresh(expiresAt: number): void {
    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
    }

    const refreshAt = expiresAt - (this.config.silentRefreshTimeout! * 1000);
    const delay = refreshAt - Date.now();

    if (delay > 0) {
      this.tokenRefreshSubscription = timer(delay).pipe(
        switchMap(() => this.refreshToken())
      ).subscribe();
    } else {
      this.refreshToken().subscribe();
    }
  }
  logout(): void {
    const tokens = this.getStoredTokens();

    if (this.tokenRefreshSubscription) {
      this.tokenRefreshSubscription.unsubscribe();
    }

    if (tokens?.id_token) {
      this.mockIdp.endSession(tokens.id_token).subscribe();
    }

    this.clearSession();
    this.router.navigate(['/login']);
  }

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

    sessionStorage.setItem('oidc_tokens', JSON.stringify(tokenStorage));
  }

  private getStoredTokens(): TokenStorage | null {
    const tokensStr = sessionStorage.getItem('oidc_tokens');
    return tokensStr ? JSON.parse(tokensStr) : null;
  }

  private updateSessionState(state: SessionState): void {
    this.sessionStateSubject.next(state);
    this.isAuthenticatedSignal.set(state.isAuthenticated);
    this.currentUserSignal.set(state.user);
  }

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

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.access_token ?? null;
  }

  getIdToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.id_token ?? null;
  }

  hasRole(role: string): boolean {
    const roles = this.userRolesSignal();
    return roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.userRolesSignal();
    return roles.some(role => userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.userRolesSignal();
    return roles.every(role => userRoles.includes(role));
  }

  getConfig(): OidcConfig {
    return { ...this.config };
  }

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
