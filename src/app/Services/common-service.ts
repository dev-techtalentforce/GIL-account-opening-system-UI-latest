import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { Observable } from 'rxjs'
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  // apiUrl: 'https://localhost:7183/api/'
  apiUrl:any='https://api-gl.prashi.dev/api/'  ;

    constructor(private http: HttpClient) {}
  patchUserStatus(payload:any): Observable<User> {
    return this.http.post<User>(`https://localhost:7183/api/Users/update`,payload);
  }
}
