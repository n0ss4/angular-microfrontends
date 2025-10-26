import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Unauthorized Component
 *
 * Página que se muestra cuando el usuario intenta acceder a un recurso
 * para el cual no tiene permisos suficientes (403 Forbidden)
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card">
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos suficientes para acceder a este recurso.</p>

        @if (currentUser) {
          <div class="info">
            <div><strong>Usuario:</strong> {{ currentUser.name }}</div>
            <div><strong>Email:</strong> {{ currentUser.email }}</div>
            <div><strong>Roles:</strong> {{ currentUser.roles.join(', ') }}</div>
          </div>
        }

        <div class="actions">
          <button (click)="goHome()">Inicio</button>
          <button (click)="goBack()" class="secondary">Atrás</button>
        </div>
      </div>
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
      max-width: 500px;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;

      h1 {
        margin: 0 0 12px;
        font-size: 24px;
        color: #c33;
      }

      > p {
        color: #666;
        margin: 0 0 24px;
        font-size: 14px;
      }
    }

    .info {
      background: #f9f9f9;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
      font-size: 13px;

      div {
        margin: 8px 0;
        color: #333;
      }

      strong {
        color: #666;
      }
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      button {
        padding: 10px 20px;
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

        &.secondary {
          background: #999;

          &:hover {
            background: #777;
          }
        }
      }
    }
  `]
})
export class UnauthorizedComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.getCurrentUser();

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
