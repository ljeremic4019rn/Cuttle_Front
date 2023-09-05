import {Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {Card} from "../../../Models/card.model";
import {animate, keyframes, query, stagger, style, transition, trigger} from "@angular/animations";
import {GameEngineService} from "../../../services/game-engine.service";
import {CdkDrag, CdkDragEnd, CdkDragStart, CdkDragMove, CdkDragDrop} from "@angular/cdk/drag-drop";

@Component({
    selector: 'app-card-hand',
    templateUrl: './card-hand.component.html',
    styleUrls: ['./card-hand.component.css'],
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


export class CardHandComponent implements OnInit {

    myPlayerNumber: number = -1
    covered: boolean = false


    @Output()
    changeParentBorder = new EventEmitter<void>();

    constructor(public gameEngineService: GameEngineService, private renderer: Renderer2,  private el: ElementRef) {
    }

    ngOnInit(): void {
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
    }

    showDropArea(event: CdkDragStart){
        this.changeParentBorder.emit();
    }

    positionDetection(event: CdkDragEnd, card: string) {
        console.log("EVENT")
        this.changeParentBorder.emit();
        // console.log(event)

        //event.dropPoint.x/y
    }




    calculateRotation(index: number): string {
        const angleStep = 20; // Adjust the angle between cards
        // const initialAngle = -angleStep * (this.gameEngineService.playerHands.get(this.myPlayerNumber)!.length) / 2;
        const initialAngle = -angleStep * (this.gameEngineService.cardsTestHand.length) / 2;
        const rotationAngle = initialAngle + angleStep * index;
        return `rotate(${rotationAngle}deg)`;
    }

}
