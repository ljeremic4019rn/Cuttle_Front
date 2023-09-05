import {Component, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RoomService} from "../../../services/room.service";
import {GameAction} from "../../../Models/room.model";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {CdkDragDrop, transferArrayItem} from "@angular/cdk/drag-drop";

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
    cardPositionOnScreen: string [] = []

    visible: boolean[] = []
    borderActive : boolean = false


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

        this.cardPositionOnScreen[0] = "bottom"
        this.cardPositionOnScreen[1] = "left"
        this.cardPositionOnScreen[2] = "top"
        this.cardPositionOnScreen[3] = "right"

        this.visible[0] = false
        this.visible[1] = false
        this.visible[2] = false
        this.visible[3] = false
    }


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.gameAction.roomKey = params.get('key')!;
        });
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        this.setPlayerPositions()
        this.connect()

        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)

        for (let i = 0; i < this.gameEngineService.numberOfPlayers; i++) {
            this.visible[i] = true
        }
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


    changeBorderColor() {
        this.borderActive = !this.borderActive;
    }


    // cards = document.querySelectorAll(".card")
    //
    // observer = new IntersectionObserver(entries => {
    //     console.log("detektovalo se")
    //     entries.forEach(entrie => {
    //         entrie.target.classList.toggle("testRed", entrie.isIntersecting)
    //     })
    // },{
    //     threshold: 1
    //     }
    // )
    // dropTest(event: CdkDragDrop<string[]>) {
    //     // console.log(event)
    //     console.log("CARD HAS BEEN DROPPED")
        // this.cards = document.querySelectorAll(".card")
        // console.log(this.cards.length)
        //
        // this.cards.forEach(card =>{
        //     console.log("prosli smo za " + card)
        //     this.observer.observe(card)
        // })
        // if (event.previousContainer != event.container) {
        //     transferArrayItem(
        //         event.previousContainer.data,
        //         event.container.data,
        //         event.previousIndex,
        //         event.container.data.length,
        //     );
        // }
        // else {
        //     console.log("its the same place")
        // }
    // }




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

    setPlayerPositions() {
        if (this.gameEngineService.numberOfPlayers == 2) {
            switch (this.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "top"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "bottom"
                    break
            }
        }
        else if (this.gameEngineService.numberOfPlayers == 3) {
            switch (this.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "left"
                    this.cardPositionOnScreen[2] = "top"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "bottom"
                    this.cardPositionOnScreen[2] = "left"
                    break
                case 2:
                    this.cardPositionOnScreen[0] = "left"
                    this.cardPositionOnScreen[1] = "top"
                    this.cardPositionOnScreen[2] = "bottom"
                    break
            }
        }
        else if (this.gameEngineService.numberOfPlayers == 4) {
            switch (this.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "left"
                    this.cardPositionOnScreen[2] = "top"
                    this.cardPositionOnScreen[3] = "right"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "right"
                    this.cardPositionOnScreen[1] = "bottom"
                    this.cardPositionOnScreen[2] = "left"
                    this.cardPositionOnScreen[3] = "top"
                    break
                case 2:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "right"
                    this.cardPositionOnScreen[2] = "bottom"
                    this.cardPositionOnScreen[3] = "left"
                    break
                case 3:
                    this.cardPositionOnScreen[0] = "left"
                    this.cardPositionOnScreen[1] = "1op"
                    this.cardPositionOnScreen[2] = "right"
                    this.cardPositionOnScreen[3] = "bottom"
                    break
            }
        }
    }

}
