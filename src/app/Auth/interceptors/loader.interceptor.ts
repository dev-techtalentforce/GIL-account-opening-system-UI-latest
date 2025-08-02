import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../../Services/auth-service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(NgxSpinnerService);
  const authService = inject(AuthService);
  loader.show();

  return next(req).pipe(
    catchError((error) => {
       ;
      loader.hide();
      if (error.status === 401) {
         authService.logout();
      }
      throw error;
    }),
    finalize(() => {
      loader.hide();
    })
  );
};
