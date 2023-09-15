import {Component, OnInit} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {Router} from "@angular/router";
import {RoomService} from "../../services/room.service";
import {GameEngineService} from "../../services/game-engine.service";
import * as SockJS from "sockjs-client";
import {environment} from "../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {JoinRoomResponse} from "../../Models/auth.model";
import {RoomUpdateResponse} from "../../Models/room.model";

@Component({
    selector: 'app-create-or-join-room',
    templateUrl: './create-or-join-room.component.html',
    styleUrls: ['./create-or-join-room.component.css']
})
export class CreateOrJoinRoomComponent implements OnInit {

    // @ts-ignore
    stompClient: CompatClient;

    isConnected: boolean = false;
    joinRoomKey: string
    createRoomKey: string
    actualRoomKey: string
    playersInRoom: string[] = []


    constructor(private formBuilder: FormBuilder, private router: Router, private roomService: RoomService, private gameEngineService: GameEngineService,) {
        this.joinRoomKey = ''
        this.createRoomKey = ''
        this.actualRoomKey = ''
        this.playersInRoom[0] = '+'
        this.playersInRoom[1] = '+'
        this.playersInRoom[2] = '+'
        this.playersInRoom[3] = '+'
    }

    ngOnInit(): void {
    }

    //todo stavi da dugmici nesto rade, mozda inv, mozda kick, mozda oba

    joinRoom() {
        if (this.joinRoomKey == ""){
            alert("You must input a join key first")
            return
        }

        this.roomService.joinRoom(this.joinRoomKey).subscribe({
            next: value => {
                console.log(value)

                this.disconnect()
                this.clearOldPlayerSlots()
                let joinRoomResponse: JoinRoomResponse = JSON.parse(value);

                sessionStorage.setItem("username", joinRoomResponse.playerUsername)
                sessionStorage.setItem("myPlayerNumber", joinRoomResponse.playerNumber.toString())
                this.updatePlayersInRoom(joinRoomResponse.currentPlayersInRoom)
                this.actualRoomKey = this.joinRoomKey
                this.createRoomKey = ""//clear so the create and join dont mix

                this.connect()
            },
            error: err => {
                console.log(err.error)
                alert(err.error)
            }
        })
    }

    createRoom() {
        this.roomService.createRoom().subscribe({
            next: value => {
                console.log(value.roomKey)

                this.disconnect()
                this.clearOldPlayerSlots()

                this.createRoomKey = value.roomKey
                this.actualRoomKey =  value.roomKey
                sessionStorage.setItem("myPlayerNumber", "0")

                console.log(sessionStorage.getItem("username")!)
                this.playersInRoom[0] = sessionStorage.getItem("username")!

                this.connect()
            },
            error: err => {
                console.log(err)
            }
        })
    }

    startRoom() {
        this.roomService.startRoom(this.actualRoomKey).subscribe({
            next: response => {
                console.log("we got a response")
                // const gameResponse = JSON.parse(response);
                this.gameEngineService.setUpGame(JSON.parse(response))
                this.disconnect()
                this.router.navigate(["room/" + this.actualRoomKey])
            },
            error: err => {
                alert(err.error)
            }
        })
    }

    startRoomBtnVisible(): object{
        if(this.createRoomKey != "") return {'visibility': 'visible'}
        return {'visibility': 'hidden'}
    }

    updateRoom(newState: any) {
        let roomUpdateResponse: RoomUpdateResponse = JSON.parse(newState.body)

        if (roomUpdateResponse.roomUpdateType == "JOIN"){
            this.updatePlayersInRoom(roomUpdateResponse.currentPlayersInRoom)
        }
        else if (roomUpdateResponse.roomUpdateType == "START"){
            console.log(roomUpdateResponse.gameResponse)
            this.gameEngineService.setUpGame(roomUpdateResponse.gameResponse)
            this.disconnect()
            this.router.navigate(["room/" + this.actualRoomKey])
        }
    }

    connect() {
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${sessionStorage.getItem('token')}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        this.stompClient.subscribe(`/cuttle/updateRoom/` + this.actualRoomKey, this.updateRoom.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    updatePlayersInRoom(newPlayerList: string[]){
        for (let i = 0; i < newPlayerList.length; i++) {
            if (newPlayerList[i] != ""){
                this.playersInRoom[i] = newPlayerList[i]
            }
        }
    }

    clearOldPlayerSlots(){
        this.playersInRoom[0] = "+"
        this.playersInRoom[1] = "+"
        this.playersInRoom[2] = "+"
        this.playersInRoom[3] = "+"
    }

    disconnect() {
        if (this.stompClient != null) {
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }

}
