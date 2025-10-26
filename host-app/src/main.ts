import { initFederation } from '@angular-architects/native-federation';
import { init as initModuleFederation } from '@module-federation/enhanced/runtime';
import { getShared } from './app/shared/federation-helpers';

initFederation('/assets/federation.manifest.json')
  .catch(err => console.error(err))
  .then(_ => {
    const shared = getShared();

    initModuleFederation({
      name: 'shell',
      remotes: [
          {
            name: 'mfe1-app',
            entry: 'http://localhost:4201/remoteEntry.js',
            type: 'esm',
          },
          {
            name: 'mfe2-app',
            entry: 'http://localhost:4202/remoteEntry.js',
            type: 'esm',
          },
      ],
      shared,
    }).initializeSharing();

    import('./bootstrap');
  })
  .catch(err => console.error(err));
