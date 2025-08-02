import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {environment }  from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AccountOpen {
  private baseUrl = `${environment.hostURL}`;
    // private baseUrl = 'https://localhost:7183/api/AccountOpen';
     constructor(private http: HttpClient) {}

   insertAccount(data: any){
    return this.http.post(`${this.baseUrl}AccountOpen/insert`, data);
  }
}
