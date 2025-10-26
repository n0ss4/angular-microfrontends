import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

(async () => {
  const app = await createApplication({
    providers: []
  });

  const mfe4Element = createCustomElement(AppComponent, {
    injector: app.injector
  });

  customElements.define('mfe4-element', mfe4Element);
})();
