import {Injectable} from '@angular/core';
import {Card} from "../Models/card.model";
import {RoomService} from "./room.service";
import {LoginComponent} from "../components/login/login.component";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public numberOfPlayers: number = 2 //todo vrati na 0
    public currentPlayersTurn: number = 0;
    public power8InAction: number = 0
    public forced7Card = null

    public deck: string[] = []
    public graveyard: string[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()

    // public cardsTestHand: string[] = ["1_C", "2_C", "3_C", "8_C"]
    // public cardsTestTable: string[] = ["1_D", "K_D", "Q_D", "4_D", "P_8_D", "J_S_0_J_H_2_J_C_1_J_D_2_10_D"]
    // public deckTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D"]
    // public graveYardTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]


    constructor(private roomService: RoomService) {

        this.playerHands.set(0, ["1_C", "2_C", "3_C", "K_C"])
        this.playerHands.set(1, ["1_C", "2_C", "3_C", "8_C"])
        this.playerHands.set(2, ["1_C", "2_C", "3_C", "8_C"])
        this.playerHands.set(3, ["1_C", "2_C", "3_C", "8_C"])

        this.playerTables.set(0, ["1_C", "2_C", "3_C", "K_C"])
        this.playerTables.set(1, ["1_C", "2_C", "3_C", "Q_C"])
        this.playerTables.set(2, ["1_C", "2_C", "3_C", "Q_H"])
        this.playerTables.set(3, ["1_C", "2_C", "3_C", "8_C"])

        this.deck = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]
        this.graveyard = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]
    }

    setUpGame(gameResponse: any) {
        // const gameResponse = JSON.parse(newState);
        // const gameResponse = newState
        console.log(gameResponse);

        //just in case we clear the lists
        this.deck = []
        this.graveyard = []
        this.playerHands.clear()
        this.playerTables.clear()
        this.playerScore.clear()

        this.numberOfPlayers = this.getMapSize(gameResponse.playerHands)
        this.currentPlayersTurn = gameResponse.currentPlayersTurn
        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, gameResponse.playerHands[i])
            this.playerTables.set(i, gameResponse.playerTables[i])
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        console.log("nakon settovanja")//todo skloni ovo
        this.printAll()
    }


    updateGameState(gameResponse: any) {
        console.log("new state received from the server: ")
        console.log(gameResponse)

        this.forced7Card = null//todo keep an eye on this just in case
        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        this.currentPlayersTurn = parseInt(gameResponse.currentPlayersTurn)
        console.log("KURAC  " + this.currentPlayersTurn)
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, gameResponse.playerHands[i])
            this.playerTables.set(i, gameResponse.playerTables[i])
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        if (gameResponse.gameResponseType == "SEVEN"){
            let handLength = gameResponse.playerHands[this.currentPlayersTurn].length
            this.forced7Card = gameResponse.playerHands[this.currentPlayersTurn][handLength - 1]
        }

        console.log("nakon UPDATE")//todo skloni ovo
        this.printAll()
    }

    getMapSize(map: Map<number, string[]>): number{
        let size = 0;
        for (const i in map){
            size++
        }
        return size
    }

    printAll(){
        console.log(this.deck)
        console.log(this.graveyard)
        console.log(this.playerHands)
        console.log(this.playerTables)
        console.log(this.playerScore)
    }

    filterDOMElementIds(elements: NodeListOf<Element>, filterWord: string) {
        const filteredElements = [];
        for (const element of Array.from(elements)) {
            if (element.id && element.id.startsWith(filterWord)) {
                filteredElements.push(element);
            }
        }
        return filteredElements;
    }


}
