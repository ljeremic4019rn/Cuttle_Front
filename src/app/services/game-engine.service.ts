import {Injectable} from '@angular/core';
import {Card} from "../Models/card.model";
import {RoomService} from "./room.service";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public numberOfPlayers: number = 4; //todo vrati na 0
    public deck: Card[] = []
    public graveyard: Card[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()

    public cardsTestHand: string[] = ["1_C", "2_C", "3_C", "4_C", "5_C", "6_C", "7_C", "8_C"]
    public cardsTestTable: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "6_D", "7_D", "8_D"]


    constructor(private roomService: RoomService) {
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
        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, gameResponse.playerHands[i])
            this.playerTables.set(i, gameResponse.playerTables[i])
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        console.log("nakon settovanja")//todo skloni ovo
        console.log(this.deck)
        console.log(this.graveyard)
        console.log(this.playerHands)
        console.log(this.playerTables)
        console.log(this.playerScore)

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
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, newState.playerHands[i])
            this.playerTables.set(i, newState.playerTables[i])
            this.playerScore.set(i, newState.playerScore[i])
        }

        console.log("nakon UPDATE")//todo skloni ovo
        console.log(this.deck)
        console.log(this.graveyard)
        console.log(this.playerHands)
        console.log(this.playerTables)
        console.log(this.playerScore)

    }

    getMapSize(map: Map<number, string[]>): number{
        let size = 0;
        for (const i in map){
            size++
        }
        return size
    }

}
