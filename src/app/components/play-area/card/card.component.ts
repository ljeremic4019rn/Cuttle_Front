import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {GameEngineService} from "../../../services/game-engine.service";


@Component({
    selector: 'doc-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnInit {

    @Input()
    public card: string = ""

    @Input()
    public covered: boolean = true//todo stavi da je sve osim moje pokriveno


    suit: string = ""
    value: string = ""
    color: string = ""

    rotated: boolean = false
    cardSplit: string[] = []
    jacksOnTopOfCard: string[] = []

    jacksOnTopOfCardMap: Map<number, string[]> = new Map<number, string[]>()

    constructor(private elementRef: ElementRef, public gameEngineService: GameEngineService) {
    }

    ngOnInit(): void {
        this.cardSplit = this.card.split('_');

        if (this.cardSplit.length == 2) {//if length is 2
            this.value = this.cardSplit[0];
            this.suit = this.cardSplit[1];
            if (this.value == "Q" || this.value == "K")
                this.rotated = true
        }
        else if (this.cardSplit[0] == "P") {
            //POWER 8 CARD P_8_<suit>
            this.value = this.cardSplit[1];
            this.suit = this.cardSplit[2];
            this.rotated = true
        }
        else {
            //JACKED CARDS DIAGRAM
            //0 1  2   3 4     0 1  2   3 4  5   6 7  8   9  10...
            //J_S_<id>_10_C || J_S_<id>_J_C_<id>_J_H_<id>_10_C
            let positionCounter = 0
            let jCard

            //collect all jacks into a list
            while (this.cardSplit[positionCounter] == "J") { //J_S_<id>_10_S - we are splitting this
                jCard = this.cardSplit[positionCounter] + "_" + this.cardSplit[positionCounter + 1]; //ctr = J + _ + S
                this.jacksOnTopOfCard.push(jCard);
                positionCounter = positionCounter + 3;
            }

            //we put the data in the map for the ease of use in html
            for (let i = 0; i < this.jacksOnTopOfCard.length; i++) {
                let jCardSplit = this.jacksOnTopOfCard[i].split("_")
                if (jCardSplit[1] == "H" || jCardSplit[1] == "D") {
                    this.jacksOnTopOfCardMap.set(i, [jCardSplit[0], jCardSplit[1], "red"])
                } else this.jacksOnTopOfCardMap.set(i, [jCardSplit[0], jCardSplit[1], "black"])
            }

            this.value = this.cardSplit[this.cardSplit.length - 2]
            this.suit = this.cardSplit[this.cardSplit.length - 1]
        }

        //set color of the main card
        if (this.suit == "H" || this.suit == "D") {
            this.color = "red"
        } else this.color = "black"
    }

    isRotated(): object {
        if (this.rotated)
            return {
                'transform': 'translate(0%, -15%) rotate(-90deg)',
                'margin-right': '16px',
                'margin-left': '16px'
            }
        return {}
    }

    click() {
        console.log("KLIKNUTO NA " + this.value + "_" + this.suit)
    }

}
