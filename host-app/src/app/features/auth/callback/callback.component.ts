import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Callback Component
 *
 * Componente que maneja el callback de autorización OIDC
 * Se activa cuando el IdP redirige de vuelta a la aplicación
 * después de un login exitoso con el authorization code
 *
 * Ruta típica: /auth/callback?code=xxx&state=xxx
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      @if (isProcessing) {
        <div class="card">
          <div class="spinner"></div>
          <p>Procesando autenticación...</p>
        </div>
      }

      @if (error) {
        <div class="card">
          <h2>Error</h2>
          <p>{{ error }}</p>
          <button (click)="goToLogin()">Volver al Login</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 20px;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;

      h2 {
        margin: 0 0 16px;
        font-size: 20px;
        color: #333;
      }

      p {
        color: #666;
        margin: 0 0 24px;
        font-size: 14px;
      }

      button {
        padding: 12px 24px;
        background: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #357abd;
        }
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top-color: #4a90e2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isProcessing = true;
  error: string | null = null;

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];
      const errorDescription = params['error_description'];

      // Si hay error del IdP
      if (error) {
        console.error('❌ Error del IdP:', error, errorDescription);
        this.error = errorDescription || 'Error de autenticación';
        this.isProcessing = false;
        return;
      }

      // Si no hay code, redirigir a login
      if (!code || !state) {
        console.error('❌ Callback inválido: falta code o state');
        this.error = 'Parámetros de callback inválidos';
        this.isProcessing = false;
        return;
      }

      // Procesar el callback
      this.processCallback(code, state);
    });
  }

  /**
   * Procesa el callback de autorización
   */
  private processCallback(code: string, state: string): void {
    console.log('🔄 Procesando callback de autorización...');

    this.authService.handleAuthCallback(code, state).subscribe({
      next: () => {
        console.log('✅ Callback procesado exitosamente');
        // El AuthService ya maneja la navegación
      },
      error: (error) => {
        console.error('❌ Error procesando callback:', error);
        this.error = error.message || 'Error procesando la autenticación';
        this.isProcessing = false;
      }
    });
  }

  /**
   * Navega de vuelta al login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
