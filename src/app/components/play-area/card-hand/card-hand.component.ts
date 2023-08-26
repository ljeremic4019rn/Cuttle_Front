import {Component, Input, OnInit} from '@angular/core';
import {Card} from "../../../Models/card.model";
import {animate, keyframes, query, stagger, style, transition, trigger} from "@angular/animations";
import {GameEngineService} from "../../../services/game-engine.service";

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
    @Input()
    rowPlayerNumber: number = -1
    myPlayerNumber: number = -1
    visible: boolean = true
    covered: boolean = false

    constructor(public gameEngineService: GameEngineService) {
    }

    ngOnInit(): void {
        // @ts-ignore
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber"))
        // console.log("this is my player num " + this.myPlayerNumber)

        if (this.gameEngineService.numberOfPlayers < this.rowPlayerNumber + 1){
            this.visible = false
        }
        if (this.myPlayerNumber == this.rowPlayerNumber){
            this.covered = false
        }

    }

    change (){//todo remove
        this.covered = !this.covered
    }


    // calculateRot(index: number): string {
    //     const step = 140 / this.gameEngineService.cardsTest.length
    //     const angle = 20 + (index + 1) * step
    //     return `rotate(${angle}deg)`;
    // }

    calculateRotation(index: number): string {
        const angleStep = 20; // Adjust the angle between cards
        const initialAngle = -angleStep * (this.gameEngineService.playerHands.get(this.myPlayerNumber)!.length) / 2;
        const rotationAngle = initialAngle + angleStep * index;
        return `rotate(${rotationAngle}deg)`;
    }

}
