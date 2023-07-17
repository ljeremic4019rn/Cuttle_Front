import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {LoginResponse} from "../Models/auth.model";
import {environment} from "../../environments/environment";
import {tap} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private loginSubject = new Subject<void>();

    constructor(private httpClient: HttpClient) {
    }

    login(username: string, password: string): Observable<any> {
        return this.httpClient.post<LoginResponse>(`${environment.cuttleEngineServer}/auth/login`, {
            username: username,
            password: password
        }, {observe: 'response'})
            .pipe(
                tap(response => {
                    if (response.status === 200) {
                        this.loginSubject.next();
                    }
                })
            )
    }


    loginEvent(): Observable<void> {
        return this.loginSubject.asObservable();
    }

}
