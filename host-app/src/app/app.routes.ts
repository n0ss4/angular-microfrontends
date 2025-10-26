import { Routes } from '@angular/router';
import { loadRemote as loadModuleRemote } from '@module-federation/enhanced/runtime';
import { loadRemoteModule as loadNativeRemote } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    // MFE1 route (Module Federation)
    path: 'mfe1',
    loadComponent: () =>
      loadModuleRemote<any>('mfe1-app/Component').then((m) => m.AppComponent),
  },
  {
    // MFE2 route (Module Federation)
    path: 'mfe2',
    loadComponent: () =>
      loadModuleRemote<any>('mfe2-app/Component').then((m) => m.AppComponent),
  },
  {
    // MFE3 route (Native Federation)
    path: 'mfe3',
    loadComponent: () =>
      loadNativeRemote<any>('mfe3-app', './Component').then((m) => m.AppComponent),
  }
];
