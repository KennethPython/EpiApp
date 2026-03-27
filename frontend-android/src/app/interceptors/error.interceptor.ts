import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { ErrorDialogComponent } from '../components/error-dialog/error-dialog.component';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        dialog.closeAll();
        router.navigate(['/login']);
        return throwError(() => error);
      }
      const shouldShow = error.status === 0 || error.status === 404 || error.status >= 500;
      if (shouldShow && dialog.openDialogs.length === 0) {
        dialog.open(ErrorDialogComponent, {
          panelClass: 'error-dialog-panel',
          disableClose: false,
        });
      }
      return throwError(() => error);
    })
  );
};
