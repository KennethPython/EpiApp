import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

export const mockAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockAuth.enabled) {
    return next(req);
  }

  const { username, password, userId } = environment.mockAuth;

  if (req.method === 'POST' && req.url.includes('/api/auth/login')) {
    const body = req.body as { username?: string; password?: string };
    if (body?.username === username && body?.password === password) {
      return of(new HttpResponse({ status: 200, body: { userId, username } }));
    }
    return of(new HttpResponse({ status: 401, body: { message: 'Invalid username or password.' } }));
  }

  if (req.method === 'POST' && req.url.includes('/api/auth/register')) {
    return of(new HttpResponse({ status: 200, body: { userId, username: (req.body as any)?.username } }));
  }

  return next(req);
};
