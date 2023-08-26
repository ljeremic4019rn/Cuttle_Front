import {Component, OnInit} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {Router} from "@angular/router";
import {RoomService} from "../../services/room.service";
import {GameEngineService} from "../../services/game-engine.service";
import * as SockJS from "sockjs-client";
import {environment} from "../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {JoinRoomResponse} from "../../Models/auth.model";

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

    playersInRoom: string[] = []

    // playerSlot1: string = "+"
    // playerSlot2: string = "+"
    // playerSlot3: string = "+"
    // playerSlot4: string = "+"

    constructor(private formBuilder: FormBuilder, private router: Router, private roomService: RoomService) {
        this.joinRoomKey = ''
        this.createRoomKey = ''
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
                let joinRoomResponse: JoinRoomResponse = JSON.parse(value);

                sessionStorage.setItem("username", joinRoomResponse.playerUsername)
                sessionStorage.setItem("myPlayerNumber", joinRoomResponse.playerNumber.toString())
                this.updatePlayersInRoom(joinRoomResponse.currentPlayersInRoom)

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
                this.createRoomKey = value.roomKey
                sessionStorage.setItem("myPlayerNumber", "0")
                this.playersInRoom[0] = sessionStorage.getItem("username")!

                this.connect()
            },
            error: err => {
                console.log(err)
            }
        })
    }

    startRoom(){
        console.log("starting game")
        console.log("swaping pages")

        // this.router.navigate(["room/" + this.joinRoomKey]);

        // this.disconnect()
    }

    connect() {
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${sessionStorage.getItem('token')}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        this.stompClient.subscribe(`/cuttle/updateRoom/` + this.createRoomKey, this.updateRoom.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    updateRoom(newState: any) {
        this.updatePlayersInRoom(JSON.parse(newState.body))
    }

    updatePlayersInRoom(newPlayerList: string[]){
        for (let i = 0; i < newPlayerList.length; i++) {
            if (newPlayerList[i] != ""){
                this.playersInRoom[i] = newPlayerList[i]
            }
        }
    }

    disconnect() {
        if (this.stompClient != null) {//todo if players == 0 close room and disconnect
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }



}
