import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../model/user';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private http = inject(HttpClient);
  private server = "http://localhost:3000";

  //getting the users
  getUsers() {
    return this.http.get<User[]>("/api/users");
  }

   login(email: string, pwd: string): Observable<any> {
    //console.log(`${this.server}/api/auth`);
  return this.http.post<any>(`${this.server}/api/auth`, { email, pwd });
   }

}
