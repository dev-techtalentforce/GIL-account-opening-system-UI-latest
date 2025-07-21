/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { NsdlPayload } from '../Models/nsdl-modal';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NsdlService {
  constructor(private http: HttpClient) {}

  hostURL =''

  fetchCustomers(request: any): Observable<any> {
    const apiUrl = `${this.hostURL}/nsdl/fetch-customer`;
    return this.http.post<any>(apiUrl, request).pipe(
      catchError((error: HttpErrorResponse) => {
        const errors = error.error?.errors || ['Unknown error occurred during account check'];
        return throwError(() => errors);
      })
    );
  }

  callbackAPI() {
    const apiUrl = `${this.hostURL}/nsdl/callback`;
    return this.http.get(apiUrl);
  }
  openAccount(request: NsdlPayload): Observable<any> {
    const apiUrl = `${this.hostURL}/nsdl/account-open`;
    return this.http.post<any>(apiUrl, request).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.error || 'Account creation failed. Please try again.';
        return throwError(() => new Error(errorMessage)); // 👈 Individual error string
      })
    );
  }
}
