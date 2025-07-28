import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
// import { AgentCreditSummary, AgentDetails, AgentModel } from '../Models/agent-model';
import { catchError, Observable, throwError,map } from 'rxjs';
// import { AccountOpenDetails } from '../Models/account-open-details';
import { User } from '../Models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  host: string = environment.hostURL; // Replace with your actual API host

  private apiUrl = 'https://localhost:7183/api/';
  constructor(private http: HttpClient) {}
  

  register(user: User){
    return this.http.post(`${this.apiUrl}Users/UserRegistration`, user);
  }
  getAgentById() {
    const apiUrl = `${this.host}/agent/getAgentById`;
    return this.http.get(apiUrl);
  }
   getAllRegistrationList(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}Users/GetAllAgentList`);
  }
   getAgentAllList(): Observable<User[]> {

    debugger
    return this.http.get<User[]>(`${this.apiUrl}Users/GetAllAgentList`);
  }
  
//    getAllAgentList() {
// debugger
//     const apiUrl = `${this.host}/Users/GetAllAgentList`;
//     return this.http.get(apiUrl);
//   }
  registerBCAgent(agentData : any) {
    const apiUrl = `${this.host}/agent/registerBCAgent`;
    return this.http.post(apiUrl, agentData);
  }

  // updateBCAgent(agentData: AgentDetails) {
  //   const apiUrl = `${this.host}/agent/updateBCAgent`;
  //   return this.http.post(apiUrl, agentData);
  // }

  // not in use
  uploadDocs(agentDocs: FormData) {
    const apiUrl = `${this.host}/agent/register`;
    return this.http.post(apiUrl, agentDocs).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Upload error:', error);
    return throwError(() => new Error('Something went wrong during file upload.'));
  }

  // Admin APIs
  getAgents(status?: '') {
    const apiUrl = status ? `${this.host}/admin/agents?status=${status}` : `${this.host}/admin/agents`;
    return this.http.get(apiUrl);
  }

  approveAgent(agentId: string, status: string) {
    const apiUrl = `${this.host}/admin/approve-agent`;
    return this.http.post(apiUrl, { agentId, status, Remarks: '' });
  }

  // accountOpenAgent(accountOpenDetails: AccountOpenDetails) {
  //   const apiUrl = `${this.host}/nsdl/account-open`;
  //   return this.http.post(apiUrl, accountOpenDetails);
  // }

  // getCreditsSummary(): Observable<AgentCreditSummary[]> {
  //   const apiUrl = `${this.host}/admin/credit-summary`;
  //   return this.http.get<AgentCreditSummary[]>(apiUrl).pipe(
  //     catchError((error: HttpErrorResponse) => {
  //       const errorMsg = error.error?.error || 'Failed to fetch credit summary.';
  //       return throwError(() => new Error(errorMsg)); // 👈 single individual error
  //     })
  //   );
  // }
}
