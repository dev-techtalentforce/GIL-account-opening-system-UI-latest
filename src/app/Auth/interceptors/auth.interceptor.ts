import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../Services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(NgxSpinnerService);
  const authService = inject(AuthService);
  // const token = authService.getToken();

  // if (token) {
  //   const cloned = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  //   return next(cloned).pipe(
  //     finalize(() => {
  //       spinner.hide();
  //     })
  //   );
  // }
  return next(req);
};
