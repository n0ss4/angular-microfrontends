import { Routes } from '@angular/router';
import { loadRemote as loadModuleRemote } from '@module-federation/enhanced/runtime';
import { loadRemoteModule as loadNativeRemote } from '@angular-architects/native-federation';
import { WrapperComponent } from './wrapper/wrapper.component';

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
  },
  {
    // MFE4 route (Module Federation - Web Component)
    path: 'mfe4',
    component: WrapperComponent,
    resolve: {
      config: () => ({
        remoteName: 'mfe4-app',
        exposedModule: 'WebComponent',
        elementName: 'mfe4-element',
        kind: 'module'
      })
    }
  }
];
