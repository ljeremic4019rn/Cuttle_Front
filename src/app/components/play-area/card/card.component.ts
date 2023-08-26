import {Component, Input, OnInit} from '@angular/core';
import {Card} from "../../../Models/card.model";

@Component({
    selector: 'doc-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css']
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

    constructor() {
    }

    click(){
        console.log("KLIKNUTO NA " +this.value + "_" + this.suit)
    }

}
