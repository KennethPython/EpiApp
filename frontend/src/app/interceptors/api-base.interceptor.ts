import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (environment.apiUrl && req.url.startsWith('/api')) {
    req = req.clone({ url: environment.apiUrl + req.url });
  }

  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
