import { initFederation } from '@angular-architects/native-federation';
import { init as initModuleFederation } from '@module-federation/enhanced/runtime';
import { getShared } from './app/shared/federation-helpers';
import { environment } from './environments/environment';

initFederation('/assets/federation.manifest.json')
  .catch(err => console.error(err))
  .then(_ => {
    const shared = getShared({ singleton: true, requiredVersionPrefix: '^' });

    // FIXME: Using deprecated init() instead of createInstance() because we have a mixed setup:
    // - Host uses Native Federation + Module Federation Enhanced (runtime only)
    // - MFE1/2/4 use Webpack Module Federation (classic with remoteEntry.js)
    // - MFE3 uses Native Federation
    // The init() function has special logic to handle this heterogeneous architecture.
    // To migrate to createInstance(), all remotes must be migrated to the same Module Federation
    // implementation (either all Native Federation or all Module Federation Enhanced with build plugin).
    // See: https://module-federation.io/guide/basic/runtime/runtime-api#how-to-migrate
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
