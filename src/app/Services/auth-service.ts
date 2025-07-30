import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { LoginResponse, User, UserLoginResponseDto, ResetPassword } from '../Models/user.model';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

   constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  private _apiUrl = 'https://api-gl.prashi.dev/api/';
    private apiUrl = 'https://localhost:7183/api/'

  // public get apiUrl() {
  //   return this._apiUrl;
  // }
  // public set apiUrl(value) {
  //   this._apiUrl = value;
  // }

  private handleError(error: HttpErrorResponse) {
    console.error('Upload error:', error);
    return throwError(() => new Error('Something went wrong during file upload.'));
  }
    register(payload:any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}Users/UserRegistration`, payload).pipe(
      map(response => ({
        message: response.message || 'Registration successful'
      })),
      catchError(this.handleError)
    );
  }

   getAllRegistrationList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}Users/GetAllRegistrationList`);
  }
login(credentials: { email: string; password: string }): Observable<LoginResponse> {
  debugger
    const payload = {
      Email: credentials.email,
      PasswordHash: credentials.password
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}Users/UserLogin`, payload).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.response));
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  UpdateUserPassword(payload: any){
    return this.http.post(`${this.apiUrl}Users/update-password`, payload);
  }

   isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.roleName === 'Admin';
  }

  isAgent(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.roleName === 'Agent';
  }

  getUser(): UserLoginResponseDto | null {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }

  resetForgotPassword(email:any): Observable<ResetPassword> {
    return this.http.post<User>(`https://localhost:7183/api/Users/resetForgotPassword`,email);
  }

  updatePassword(resetPassword:any): Observable<ResetPassword> {
    return this.http.post<User>(`https://localhost:7183/api/Users/upadatePassword`, resetPassword);
  }

    // login(credentials: { email: string; password: string }): Observable<{ token: string; user: { role: string } }> {
  //   const apiUrl = `${this.host}/auth/login`;
  //   return this.http.post<{ token: string; user: { role: string } }>(apiUrl, credentials).pipe(
  //     tap((response: { token: string; user: { role: string } }) => {
  //       // decode the token if necessary
  //       localStorage.setItem(this.tokenKey, JSON.stringify(response.token));
  //       localStorage.setItem(
  //         this.userKey,
  //         JSON.stringify({
  //           agentId: this.getUserRole().AgentId,
  //           id: this.getUserRole().UserId,
  //           role: this.getUserRole().Role.toLowerCase(),
  //           email: this.getUserRole().Email,
  //           firstName: this.getUserRole().given_name,
  //           lastName: this.getUserRole().family_name
  //         })
  //       );
  //       console.log(this.getUserRole());
  //       this.loggedIn.next(true);
  //     })
  //   );
  // }

//   login(credentials: { email: string; password: string }): Observable<{ token: string; user: any }> {
//   const fakeAdminToken = 'admin.jwt.token';
//   const fakeAgentToken = 'agent.jwt.token';

//   const userData =
//     credentials.email === 'admin@gmail.com' && credentials.password === 'admin123'
//       ? {
//           token: fakeAdminToken,
//           user: {
//             Role: 'Admin',
//             UserId: 1,
//             Email: 'admin@gil.com',
//             given_name: 'Admin',
//             family_name: 'User',
//             AgentId: null
//           }
//         }
//       : credentials.email === 'agent@gmail.com' && credentials.password === 'agent123'
//       ? {
//           token: fakeAgentToken,
//           user: {
//             Role: 'Agent',
//             UserId: 2,
//             Email: 'agent@gil.com',
//             given_name: 'Agent',
//             family_name: 'User',
//             AgentId: 1001
//           }
//         }
//       : null;

//   if (userData) {
//     localStorage.setItem(this.tokenKey, JSON.stringify(userData.token));
//     localStorage.setItem(this.userKey, JSON.stringify(userData.user));
//     this.loggedIn.next(true);
//     return new Observable((observer) => {
//       observer.next(userData);
//       observer.complete();
//     });
//   } else {
//     return new Observable((observer) => {
//       observer.error({ error: { detail: 'Invalid username or password' } });
//     });
//   }
// }

//   logout(): void {
//     localStorage.removeItem(this.tokenKey);
//     localStorage.removeItem(this.userKey);
//     this.loggedIn.next(false);
//     this.router.navigate(['/login']);
//   }

//   isLoggedIn(): Observable<boolean> {
//     return this.loggedIn.asObservable();
//   }

//   getToken(): string | null {
//     return JSON.parse(localStorage.getItem(this.tokenKey));
//   }

//   removeToken(): void {
//     localStorage.removeItem(this.tokenKey);
//     localStorage.removeItem(this.userKey);
//   }

//   getUserRole(): TokenModel | null {
//     const token = this.getToken();
//     if (token) {
//       try {
//         const user: TokenModel = Object(decodeJWT(token));
//         return user;
//       } catch (error) {
//         console.error('Error decoding token', error);
//         return null;
//       }
//     }
//     return JSON.parse(localStorage.getItem(this.tokenKey));
//   }

//   hasToken(): boolean {
//     return !!JSON.parse(localStorage.getItem(this.tokenKey));
//   }

//   isAdmin(): boolean {
//     return this.getUserRole().Role === 'Admin';
//   }

//   isAgent(): boolean {
//     return this.getUserRole().Role === 'Agent';
//   }

//   hasRole(expectedRole: string): boolean {
//     return this.getUserRole().Role === expectedRole;
//   }

}
