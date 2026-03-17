import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { errorInterceptor } from './interceptors/error.interceptor';
import { mockAuthInterceptor } from './interceptors/mock-auth.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([
      ...(environment.mockAuth.enabled ? [mockAuthInterceptor] : []),
      errorInterceptor,
    ])),
    provideRouter(routes),
  ]
};
