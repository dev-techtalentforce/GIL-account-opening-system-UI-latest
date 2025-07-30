import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { Observable } from 'rxjs'
import {environment }  from '../../environments/environment'


export interface RZPCheckoutPayment {
  amount: number;
  businessID: number;
  planID: number;
  receipt: string;
}
@Injectable({
  providedIn: 'root'
})


export class CommonService {
  private baseUrl = `${environment.hostURL}`;
  // apiUrl: any='https://localhost:7183/api/'
  //   host: string = '/external-api/';
  //apiUrl:any='https://api-gl.prashi.dev/api/'  ;

    constructor(private http: HttpClient) {}
  patchUserStatus(payload:any): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}Users/update`,payload);
  }

  //   getDataByPincode(pincode: string) {
  //   const apiUrl = `/pincode/${pincode}`;
  //   return this.http.get(this.host + apiUrl);
  // }

  paymentCheckout(payment: RZPCheckoutPayment): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/verify`, payment);
  }

  AgentDetail(UserId:any): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}Users/GetAgentDetails`,UserId);
  }
}
