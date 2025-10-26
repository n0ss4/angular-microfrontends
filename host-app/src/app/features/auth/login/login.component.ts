import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MockOidcProviderService } from '../../../core/auth/services/mock-oidc-provider.service';

/**
 * Login Component
 *
 * Componente de login que simula una página de autenticación OIDC
 * Muestra un formulario de login y maneja el flujo de autenticación
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Iniciar Sesión</h1>

        @if (errorMessage()) {
          <div class="error">{{ errorMessage() }}</div>
        }

        <form (ngSubmit)="onLogin()">
          <input
            type="text"
            [(ngModel)]="username"
            name="username"
            placeholder="Email"
            required
            [disabled]="isLoading()"
            autocomplete="username"
          />

          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Contraseña"
            required
            [disabled]="isLoading()"
            autocomplete="current-password"
          />

          <button type="submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Cargando...' : 'Entrar' }}
          </button>
        </form>

        <div class="divider">o usa un usuario demo</div>

        <div class="demo-users">
          @for (user of demoUsers; track user.username) {
            <button
              type="button"
              class="demo-btn"
              (click)="fillCredentials(user.username, user.password)"
            >
              {{ user.username.split('@')[0] }}
              <span class="roles">{{ user.roles.join(', ') }}</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 8px;
      padding: 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h1 {
        margin: 0 0 24px;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
    }

    .error {
      background: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
      border-left: 3px solid #c33;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;

      input {
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #4a90e2;
        }

        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }

      button {
        padding: 12px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: #357abd;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
    }

    .divider {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin: 20px 0 16px;
      position: relative;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 40%;
        height: 1px;
        background: #ddd;
      }

      &::before { left: 0; }
      &::after { right: 0; }
    }

    .demo-users {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .demo-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f0f0f0;
        border-color: #4a90e2;
      }

      .roles {
        color: #666;
        font-size: 11px;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private mockIdp = inject(MockOidcProviderService);
  private router = inject(Router);

  // Form data
  username = '';
  password = '';

  // State
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Demo users
  demoUsers = this.mockIdp.getMockUsers();

  /**
   * Maneja el submit del formulario
   */
  onLogin(): void {
    this.errorMessage.set(null);

    if (!this.username || !this.password) {
      this.errorMessage.set('Por favor, ingresa tu usuario y contraseña');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        console.log('✅ Login exitoso, redirigiendo...');

        // Obtener la URL de retorno o ir a home
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');

        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.errorMessage.set(
          error.message === 'Invalid credentials'
            ? 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.'
            : 'Ocurrió un error al iniciar sesión. Intenta nuevamente.'
        );
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Rellena el formulario con credenciales de demo
   */
  fillCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
    this.errorMessage.set(null);
  }
}
