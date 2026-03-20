import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, throwError } from 'rxjs';
import { ErrorDialogComponent } from '../components/error-dialog/error-dialog.component';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
