import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {GameEngineService} from "../../../services/game-engine.service";



@Component({
    selector: 'doc-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css'],
})
export class CardComponent  implements OnInit{

    @Input()
    public card: string = ""

    @Input()
    public covered: boolean = true//todo stavi da je sve osim moje pokriveno

    suit: string = ""
    value: string = ""
    color: string = ""

    ngOnInit(): void {
        const cardSplit = this.card.split('_');
        this.value = cardSplit[0];
        this.suit = cardSplit[1];

        if(this.suit == "H" || this.suit == "D"){
            this.color = "red"
        } else this.color = "black"
    }

    constructor(private elementRef: ElementRef, public gameEngineService: GameEngineService) {
    }

    click(){
        console.log("KLIKNUTO NA " +this.value + "_" + this.suit)
        // console.log(this.elementRef.nativeElement.getBoundingClientRect())


        // this.card = "new card"
        // console.log(this.gameEngineService.cardsTestTable)
    }

}
