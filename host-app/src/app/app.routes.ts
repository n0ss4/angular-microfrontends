import { Routes } from '@angular/router';
import { loadRemote as loadModuleRemote } from '@module-federation/enhanced/runtime';
import { loadRemoteModule as loadNativeRemote } from '@angular-architects/native-federation';
import { WrapperComponent } from './wrapper/wrapper.component';
import { authGuard, guestGuard, roleGuard, adminGuard } from './core/auth/guards';

export const routes: Routes = [
  // ========== AUTH ROUTES ==========
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard] // Solo usuarios no autenticados
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // ========== MICROFRONTEND ROUTES (PROTECTED) ==========
  {
    // MFE1 route (Module Federation) - Requiere autenticación
    path: 'mfe1',
    loadComponent: () =>
      loadModuleRemote<any>('mfe1-app/Component').then((m) => m.AppComponent),
    canActivate: [authGuard]
  },
  {
    // MFE2 route (Module Federation) - Requiere autenticación
    path: 'mfe2',
    loadComponent: () =>
      loadModuleRemote<any>('mfe2-app/Component').then((m) => m.AppComponent),
    canActivate: [authGuard]
  },
  {
    // MFE3 route (Native Federation) - Requiere rol 'admin' o 'manager'
    path: 'mfe3',
    loadComponent: () =>
      loadNativeRemote<any>('mfe3-app', './Component').then((m) => m.AppComponent),
    canActivate: [authGuard, roleGuard],
    data: { anyRole: ['admin', 'manager'] }
  },
  {
    // MFE4 route (Module Federation - Web Component) - Solo administradores
    path: 'mfe4',
    component: WrapperComponent,
    canActivate: [authGuard, adminGuard],
    resolve: {
      config: () => ({
        remoteName: 'mfe4-app',
        exposedModule: 'WebComponent',
        elementName: 'mfe4-element',
        kind: 'module'
      })
    }
  },

  // ========== DEFAULT ROUTE ==========
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
