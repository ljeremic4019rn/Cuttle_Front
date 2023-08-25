import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RoomService} from "../../../services/room.service";
import {GameAction} from "../../../Models/room.model";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {LoginComponent} from "../../login/login.component";

@Component({
    selector: 'app-room',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

    // @ts-ignore
    stompClient: CompatClient;
    isConnected: boolean = false;

    testInputAction: string
    gameAction: GameAction


    constructor(private router: Router, private route: ActivatedRoute, private gameEngineService: GameEngineService, private roomService: RoomService) {
        // this.roomKey = ''
        this.testInputAction = ''
        this.gameAction = {
            roomKey: "",
            actionType: "",
            fromPlayer: -1,
            cardPlayed: "",
            ontoPlayer: -1,
            ontoCardPlayed: "",
            helperCardList: []
        }
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.gameAction.roomKey = params.get('key')!;
        });
        this.connect()
    }

    connect() {
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${sessionStorage.getItem('token')}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        console.log("room key")
        console.log(this.gameAction.roomKey)

        this.stompClient.subscribe(`/cuttle/update/` + this.gameAction.roomKey, this.updateGameState.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    updateGameState(newState: any) {
        this.gameEngineService.updateGameState((JSON.parse(newState.body)))
    }

    disconnect() {
        if (this.stompClient != null) {//todo if players == 0 close room and disconnect
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }

    sendAction() {
        console.log("sending to this room key")
        console.log(this.gameAction.roomKey)

        this.stompClient.send(
            `/app/playAction`,
            {},
            JSON.stringify(this.gameAction)
        );
    }

    startRoom() {
        this.roomService.startRoom(this.gameAction.roomKey).subscribe({
            next: response => {
                console.log("we got a response")
                this.gameEngineService.setUpGame(response)
            },
            error: err => {
                alert(err.error)
            }
        })
    }

}
