import {Component, ElementRef, Input, OnInit, QueryList, ViewChildren} from '@angular/core';
import {animate, keyframes, query, stagger, style, transition, trigger} from "@angular/animations";
import {GameEngineService} from "../../../services/game-engine.service";
import {CdkDragDrop, CdkDragEnd, CdkDropList, CdkDrag, CdkDragMove, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';


@Component({
    selector: 'app-card-row',
    templateUrl: './card-row.component.html',
    styleUrls: ['./card-row.component.css'],
    animations: [
        trigger('cardAnimation', [
            transition('* => *', [
                query(':enter', style({opacity: 0}), {optional: true}),
                query(':enter', stagger('100ms', [
                    animate('.75s cubic-bezier(0.215, 0.61, 0.355, 1)',
                        keyframes([
                            style({opacity: 0, transform: 'scale3d(0.3, 0.3, 0.3)', offset: 0}),
                            style({opacity: 0.2, transform: 'scale3d(1.1, 1.1, 1.1)', offset: 0.2}),
                            style({opacity: 0.4, transform: 'scale3d(0.9, 0.9, 0.9)', offset: 0.4}),
                            style({opacity: 0.6, transform: 'scale3d(1.03, 1.03, 1.03)', offset: 0.6}),
                            style({opacity: 0.8, transform: 'scale3d(0.97, 0.97, 0.97)', offset: 0.8}),
                            style({opacity: 1, transform: 'scale3d(1, 1, 1)', offset: 1.0}),
                        ]))]), {optional: true})
            ])
        ])
    ]
})



export class CardRowComponent implements OnInit {

    myPlayerNumber: number = -1
    visible: boolean = true
    covered: boolean = false


    /* todo
    card = null
    onDragStart this.draggedCard = dragged card
    <div *ngIf this == this.draggedCard invisible>
     */


    dropTest(event: CdkDragEnd) {
        console.log("EVENT")
        // console.log(event)
        //event.dropPoint.x/y
    }

    constructor(public gameEngineService: GameEngineService) {
    }

    ngOnInit(): void {
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
    }


}
