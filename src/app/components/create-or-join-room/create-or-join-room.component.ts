import {Component, OnInit} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {Router} from "@angular/router";
import {RoomService} from "../../services/room.service";

@Component({
    selector: 'app-create-or-join-room',
    templateUrl: './create-or-join-room.component.html',
    styleUrls: ['./create-or-join-room.component.css']
})
export class CreateOrJoinRoomComponent implements OnInit {

    joinRoomKey: string
    createRoomKey: string

    constructor(private formBuilder: FormBuilder, private router: Router, private roomService: RoomService) {
        this.joinRoomKey = ''
        this.createRoomKey = ''

    }

    ngOnInit(): void {
    }

    joinRoom() {
        this.roomService.joinRoom(this.joinRoomKey).subscribe({
            next: value => {
                this.router.navigate(["room/" + this.joinRoomKey]);

            },
            error: err => {
                console.log(err.error)
            }
        })    }

    createRoom() {
        this.roomService.createRoom().subscribe({
            next: value => {
                console.log(value.roomKey)
                this.createRoomKey = value.roomKey
                this.router.navigate(["room/" + this.createRoomKey]);

            },
            error: err => {
                console.log(err)
            }
        })
    }

}
