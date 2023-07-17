import {Component, OnInit} from '@angular/core';
import * as SockJS from "sockjs-client";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {Message} from "./Message";
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

    // @ts-ignore
    stompClient: CompatClient;

    isConnected: boolean = false;
    nickname: string = '';
    newMessageText: string = '';
    messages: Message[] = [];

    constructor() {
    }

    ngOnInit(): void {
    }

    connect() {
        const jwt = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyMSIsImV4cCI6MTY4OTYzMDk5NSwiaWF0IjoxNjg5NTk0OTk1fQ.1XYMLTPMcqR_ntIhAKppeqdT1aNqeHfyBMtXQdp81SH_jjf_Ga-8qLk_Xa5mxyTfRRV-o5h1kpiIqcZxlikFww';
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${jwt}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        console.log("this")
        console.log(this)
        this.stompClient.subscribe('/topic/messages', this.addNewMessage.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    addNewMessage(messageOutput: any) {
        console.log(JSON.parse(messageOutput.body))
        this.messages.push(JSON.parse(messageOutput.body));
    }

    disconnect() {
        if (this.stompClient != null) {
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }

    sendMessage() {
        this.stompClient.send("/app/send-message", {}, JSON.stringify({
            'from': this.nickname,
            'text': this.newMessageText
        }));
        this.newMessageText = '';
    }
}
