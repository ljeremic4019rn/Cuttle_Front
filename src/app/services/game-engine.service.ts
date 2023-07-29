import {Injectable} from '@angular/core';
import {Card} from "../Models/card.model";
import {RoomService} from "./room.service";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public deck: Card[] = []
    public graveyard: Card[] = []
    public playerHands: Map<number, Card[]> = new Map<number, Card[]>()
    public playerTables: Map<number, Card[]> = new Map<number, Card[]>()
    public playerScores: Map<number, number> = new Map<number, number>()

    public cardsTest: Card[] = []


    constructor(private roomService: RoomService) {
        this.playerHands.set(0, [])
        this.playerHands.set(1, [])
        this.playerHands.set(2, [])
        this.playerTables.set(0, [])
        this.playerTables.set(1, [])
        this.playerTables.set(2, [])
    }

    setUpGame(newState: any) {
        console.log("SAD CE JEBANJE")
        const gameResponse = JSON.parse(newState);
        console.log(gameResponse);

        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard

        console.log("JEBANJE 2.0")

        for (var i in gameResponse.playerHands) {
            // @ts-ignore
            this.playerHands[i] = gameResponse.playerHands[i];
            // @ts-ignore
            this.playerTables[i] = gameResponse.playerTables[i];
        }

        // @ts-ignore
        this.cardsTest = this.playerHands.get(0)

        console.log(this.playerHands)
        console.log(this.playerTables)

        // for (var j in gameResponse.playerTables) {
        // }

        // for (var k in gameResponse.playerScores) {
        //     // @ts-ignore
        //     this.playerScores[k] = gameResponse.playerScores[k];//todo pogledaj ovoga posle
        // }
        // console.log("kriminalac")
        // console.log(this.playerScores)





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

    }


}
