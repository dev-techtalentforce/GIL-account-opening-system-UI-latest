import { Injectable } from '@angular/core';
import {
  AdminTransaction,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  WalletBalanceResponse
} from '../Models/wallet-model';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {environment }  from '../../environments/environment'


export interface OrderDetails {
  orderID: string;
  amount: number;
  receipt: string;
  status: string;
  createdAt: Date;
}
@Injectable({
  providedIn: 'root'
})
export class WalletService {
  constructor(private http: HttpClient) {}
    private baseUrl = `${environment.hostURL}`;

  // private apiUrl = 'https://localhost:7183/api/Payments';
 private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();
  hostURL='';

   initiatePayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}Payments/paymentProcessing`, data);
  }

  verifyPayment(payload:any): Observable<any> {
    return this.http.post(`${this.baseUrl}Payments/verifyPayment`, payload);
  }
  

  getPaymentsByAgentId(agentId: any){
    //return this.http.get(`${this.baseUrl}Payments/GetByAgentId?agentId=${agentId}`);
    return this.http.get(`${this.baseUrl}Payments/${agentId}`);
  }


// setBalance(value: number) {
//     this.balanceSubject.next(value);
//   }


  // getWalletBalance(): Observable<WalletBalanceResponse> {
  //   const apiUrl = `${this.hostURL}/wallet/balance`;
  //   return this.http.get<WalletBalanceResponse>(apiUrl).pipe(
  //     catchError((error: HttpErrorResponse) => {
  //       const errorMsg = error.error?.error || 'Unable to fetch wallet balance.';
  //       return throwError(() => new Error(errorMsg));
  //     })
  //   );
  // }

  // For admin
  // topupHistory(agentId: any): Observable<AdminTransaction[]> {
  //   const apiURL = `${this.hostURL}/wallet/topup-history?agentId=${agentId}`;
  //   return this.http.get<AdminTransaction[]>(apiURL).pipe(
  //     catchError((error: HttpErrorResponse) => {
  //       const errorMsg = error.error?.error || 'Failed to fetch transactions.';
  //       return throwError(() => new Error(errorMsg));
  //     })
  //   );
  // }
}
