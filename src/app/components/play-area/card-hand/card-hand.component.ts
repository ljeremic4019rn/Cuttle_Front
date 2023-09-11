import {Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {Card, CardDto} from "../../../Models/card.model";
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

    @Output()
    cdkDragStoppedEvent = new EventEmitter<CardDto>();
    @Output()
    cdkDragStartedEvent = new EventEmitter<void>();

    myPlayerNumber: number = -1
    positionNumber: number = -1
    covered: boolean = true//todo vrati covered na true
    dragDisabled = true

    constructor(public gameEngineService: GameEngineService, private elementRef: ElementRef) {
    }

    ngOnInit(): void {
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        this.positionNumber = parseInt(this.elementRef.nativeElement.id.split("-")[1])

        //if 8-power card is in action, uncover all enemy cards
        if (this.gameEngineService.power8InAction != 0){
            this.covered = false
        }

        if (this.positionNumber == this.myPlayerNumber){
            this.dragDisabled = false
            this.covered = false
        }

    }

    cdkDragStartedFun(event: CdkDragStart){
        this.cdkDragStartedEvent.emit();
    }

    cdkDragEndedFun(event: CdkDragEnd, card: string) {
        const cardDto: CardDto = {
            event: event,
            card: card
        };
        this.cdkDragStoppedEvent.emit(cardDto);
    }


    calculateRotation(index: number): string {
        const angleStep = 20; // Adjust the angle between cards
        // const initialAngle = -angleStep * (this.gameEngineService.playerHands.get(this.myPlayerNumber)!.length) / 2;
        const initialAngle = -angleStep * (this.gameEngineService.cardsTestHand.length) / 2;
        const rotationAngle = initialAngle + angleStep * index;
        return `rotate(${rotationAngle}deg)`;
    }

}
