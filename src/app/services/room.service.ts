import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {GameAction} from "../Models/room.model";


@Injectable({
    providedIn: 'root'
})
export class RoomService {

    private headers
    private token: string


    constructor(private httpClient: HttpClient) {
        this.token = sessionStorage.getItem("token")!
        this.headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Access-Control-Allow-Origin', '*')
            .set('Authorization', `Bearer ${this.token}`)
    }


    //      , {
    //         headers: this.headers,
    //         responseType: 'text' as 'json'
    //       }

    createRoom(): Observable<any> {
        return this.httpClient.post<any>(`${environment.cuttleEngineServer}/room/createRoom`
            ,{}
            , {headers: this.headers})
    }

    joinRoom(roomKey: string): Observable<any> {
        return this.httpClient.get<any>(`${environment.cuttleEngineServer}/room/joinRoom/${roomKey}`
            , {headers: this.headers, responseType: 'text' as 'json'})
    }

    startRoom(roomKey: string): Observable<any> {
        return this.httpClient.post<any>(`${environment.cuttleEngineServer}/room/startRoom/${roomKey}`
            ,{}
            , {headers: this.headers , responseType: 'text' as 'json'})
    }

    stopRoom(roomKey: string): Observable<any> {
        return this.httpClient.post<any>(`${environment.cuttleEngineServer}/room/stopRoom/${roomKey}`
            ,{}
            , {headers: this.headers, responseType: 'text' as 'json'})
    }

    playAction(roomKey: string, gameAction: GameAction): Observable<any> {
        return this.httpClient.post<any>(`${environment.cuttleEngineServer}/room/createRoom/${roomKey}`
            ,{action: gameAction.action}
            , {headers: this.headers, responseType: 'text' as 'json'})
    }

}
