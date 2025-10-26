import { initFederation } from '@angular-architects/native-federation';
import { init as initModuleFederation } from '@module-federation/enhanced/runtime';
import { getShared } from './app/shared/federation-helpers';
import { environment } from './environments/environment';

initFederation('/assets/federation.manifest.json')
  .catch(err => console.error(err))
  .then(_ => {
    const shared = getShared();

    initModuleFederation({
      name: 'shell',
      remotes: [
          {
            name: 'mfe1-app',
            entry: `${environment.mfe1Url}/remoteEntry.js`,
            type: 'esm',
          },
          {
            name: 'mfe2-app',
            entry: `${environment.mfe2Url}/remoteEntry.js`,
            type: 'esm',
          },
          {
            name: 'mfe4-app',
            entry: `${environment.mfe4Url}/remoteEntry.js`,
            type: 'esm',
          },
      ],
      shared,
    }).initializeSharing();

    import('./bootstrap');
  })
  .catch(err => console.error(err));
