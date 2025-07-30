import { Injectable } from '@angular/core';
import { BcAgentRegistration } from '../Models/BcAgentRegistration.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {environment }  from '../../environments/environment'



@Injectable({
  providedIn: 'root'
})
export class BcAgentService {
    private baseUrl = `${environment.hostURL}`;

    // private apiUrl = 'https://localhost:7183/api/BcAgentRegistration/register'; // Adjust as needed

  constructor(private http: HttpClient) {}

  registerAgent(data: BcAgentRegistration): Observable<any> {
    return this.http.post(`${this.baseUrl}/BcAgentRegistration/register`, data);
  }
}
