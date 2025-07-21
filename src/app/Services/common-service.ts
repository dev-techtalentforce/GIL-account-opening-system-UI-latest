import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { Observable } from 'rxjs'

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
  apiUrl: any='https://localhost:7183/api/'

    host: string = '/external-api/';

  //apiUrl:any='https://api-gl.prashi.dev/api/'  ;

    constructor(private http: HttpClient) {}
  patchUserStatus(payload:any): Observable<User> {
    return this.http.post<User>(`https://localhost:7183/api/Users/update`,payload);
  }

    getDataByPincode(pincode: string) {
    const apiUrl = `/pincode/${pincode}`;
    return this.http.get(this.host + apiUrl);
  }

  paymentCheckout(payment: RZPCheckoutPayment): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/verify`, payment);
  }
}
