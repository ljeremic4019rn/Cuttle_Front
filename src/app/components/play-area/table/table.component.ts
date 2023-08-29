import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RoomService} from "../../../services/room.service";
import {GameAction} from "../../../Models/room.model";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {LoginComponent} from "../../login/login.component";
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";

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

    myPlayerNumber: number = -1
    cardsPositionsOnScreen: number [] = []


    constructor(private router: Router, private route: ActivatedRoute, public gameEngineService: GameEngineService, private roomService: RoomService) {
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

        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)

        this.cardsPositionsOnScreen[0] = 0
        this.cardsPositionsOnScreen[1] = 1
        this.cardsPositionsOnScreen[2] = 2
        this.cardsPositionsOnScreen[3] = 3

        console.log("this is my player number " + this.myPlayerNumber)

        //we are rotating all hands and table cards so the player has their cards at the bottom
        for (let i = 0; i < 4; i++) {
            this.cardsPositionsOnScreen[i] = this.cardsPositionsOnScreen[i] - this.myPlayerNumber
            if (this.cardsPositionsOnScreen[i] < 0) this.cardsPositionsOnScreen[i] = 3

            console.log("for i = " + i + " number is " + this.cardsPositionsOnScreen[i])
        }

        this.connect()

    }

    //game engine
    sendAction() {
        console.log("sending to this room key")
        console.log(this.gameAction.roomKey)

        this.stompClient.send(
            `/app/playAction`,
            {},
            JSON.stringify(this.gameAction)
        );
    }

    dropTest(event: CdkDragDrop<string[]>) {
        console.log(event)

        if (event.previousContainer === event.container) {
            // moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
        }
    }



    //connectivity

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

}
