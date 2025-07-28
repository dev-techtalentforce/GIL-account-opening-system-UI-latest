import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountOpen {
     private baseUrl = 'https://localhost:7183/api/AccountOpen';
     constructor(private http: HttpClient) {}

   insertAccount(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/insert`, data);
  }
}
