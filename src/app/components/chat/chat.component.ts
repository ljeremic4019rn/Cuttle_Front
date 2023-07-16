import { Component, OnInit } from '@angular/core';
import * as SockJS from "sockjs-client";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {Message} from "./Message";

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

  constructor() { }

  ngOnInit(): void {
  }

  connect() {
    const jwt = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyMSIsImV4cCI6MTY0MjEyODEyNiwiaWF0IjoxNjQyMDkyMTI2fQ.oIVbtsZl1Hh4-Ccfk7zYAO6fqo7RbRHmXoIEihvlEu2UKguPgtmvnYZmhQoP9WFTZp0ULcJS4tj3kTQWD4kZYw';
    const socket = new SockJS(`http://localhost:8080/ws?jwt=${jwt}`);
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
    if(this.stompClient != null) {
      this.stompClient.disconnect();
    }
    this.isConnected = false;
    console.log("Disconnected");
  }

  sendMessage() {
    this.stompClient.send("/app/send-message", {}, JSON.stringify({'from': this.nickname, 'text': this.newMessageText}));
    this.newMessageText = '';
  }
}
