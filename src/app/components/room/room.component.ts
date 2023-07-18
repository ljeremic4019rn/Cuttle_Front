import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
    selector: 'app-room',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

    roomKey: string
    testInputAction: string

    constructor(private router: Router, private route: ActivatedRoute) {
        this.roomKey = ''
        this.testInputAction = ''
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.roomKey = params.get('key')!;
        });
    }


    testAction(){

    }

}
