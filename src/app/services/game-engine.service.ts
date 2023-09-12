import {Injectable} from '@angular/core';
import {Card} from "../Models/card.model";
import {RoomService} from "./room.service";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public numberOfPlayers: number = 2 //todo vrati na 0
    public currentPlayersTurn: number = 0;
    public power8InAction: number = 0

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

        this.playerHands.set(0, ["1_C", "2_C", "9_C", "K_C"])
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

        // //todo ovo ce vrv da se promeni kasnije, biris nepotrebne
        // if (gameResponse.gameResponseType == "REGULAR_GO_NEXT") {
        //     console.log("regular turn")
        // } else if (gameResponse.gameResponseType == "SEVEN") {
        //     console.log("SEVEN turn")
        // } else if (gameResponse.gameResponseType == "GAME_OVER_WON") {
        //     console.log("PLAYER WON " + gameResponse.playerWhoWon)
        // }
    }


    updateGameState(newState: any) {
        console.log("new state received from the server: ")
        console.log(newState)

        this.deck = newState.deck
        this.graveyard = newState.graveyard
        this.currentPlayersTurn = parseInt(newState.currentPlayersTurn)
        console.log("KURAC  " + this.currentPlayersTurn)
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, newState.playerHands[i])
            this.playerTables.set(i, newState.playerTables[i])
            this.playerScore.set(i, newState.playerScore[i])
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

}
