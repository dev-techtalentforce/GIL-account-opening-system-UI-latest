import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../Services/auth-service';

@Injectable({ providedIn: 'root' })
export class authGuard 
 {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  // canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
  //   const expectedRoles = route.data['roles'] as Array<string>;
  //   const userRole = this.authService.getUserRole().Role.toLowerCase();
  //   if (expectedRoles.includes(userRole)) {
  //     return true;
  //   }
  //   this.authService.removeToken();
  //   this.router.navigate(['/login']);
  //   return false;
  // }
}
