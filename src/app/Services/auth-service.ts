import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { LoginResponse, User, UserLoginResponseDto } from '../Models/user.model';



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

}
