import {Component, Input, OnInit} from '@angular/core';
import {animate, keyframes, query, stagger, style, transition, trigger} from "@angular/animations";
import {GameEngineService} from "../../../services/game-engine.service";
import {CdkDragDrop, CdkDropList, CdkDrag, CdkDragMove, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';


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
    @Input()
    rowPlayerNumber: number = -1
    // rowPlayerNum: number = -1
    myPlayerNumber: number = -1
    visible: boolean = true
    covered: boolean = false

    constructor(public gameEngineService: GameEngineService) {
    }

    ngOnInit(): void {
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        // console.log("this is my player num " + this.myPlayerNumber)

        if (this.gameEngineService.numberOfPlayers < this.rowPlayerNumber + 1){
            this.visible = false
        }
        if (this.myPlayerNumber == this.rowPlayerNumber){
            this.covered = false//todo stavi ovo na true
        }
    }

    drop(event: CdkDragDrop<string[]>) {
        console.log("triggered")
        moveItemInArray(this.gameEngineService.cardsTestTable, event.previousIndex, event.currentIndex);
    }

    onDragStarted(item: any) {
        // Initialize dragging state
        item.dragging = true;
    }

    onDragEnded(item: any) {
        // Reset dragging state
        item.dragging = false;
    }

    onDragMoved(event: CdkDragMove, draggedItem: any) {
        // console.log("moving")
        // console.log(event)
        // console.log(draggedItem)


        // for (const targetItem of this.gameEngineService.cardsTestTable) {
        //     if (draggedItem !== targetItem && targetItem.dragging !== true) {
        //         if (
        //             event.pointerPosition.x > targetItem.position.x &&
        //             event.pointerPosition.x < targetItem.position.x + 100 && // Assuming width is 100px
        //             event.pointerPosition.y > targetItem.position.y &&
        //             event.pointerPosition.y < targetItem.position.y + 50 // Assuming height is 50px
        //         ) {
        //             // Collision detected, update styles or perform actions
        //             console.log('Collision detected between', draggedItem.name, 'and', targetItem.name);
        //         }
        //     }
        // }
    }


}
