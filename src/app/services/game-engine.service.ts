import {Injectable} from '@angular/core';
import {Card} from "../Models/card.model";
import {RoomService} from "./room.service";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public numberOfPlayers: number = 0;
    public deck: Card[] = []
    public graveyard: Card[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()

    public cardsTest: Card[] = []


    constructor(private roomService: RoomService) {
    }

    setUpGame(newState: any) {
        const gameResponse = JSON.parse(newState);
        console.log(gameResponse);

        console.log("tmp clear")//todo skloni kasnije
        this.playerHands.clear()
        this.playerTables.clear()
        this.playerScore.clear()

        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        this.numberOfPlayers = this.getMapSize(gameResponse.playerHands)

        console.log("kurac")
        console.log(gameResponse.playerScore)

        for (let i = 0; i < this.numberOfPlayers; i++) {
            console.log("uradjeno za " + i)
            console.log("ruka")
            this.playerHands.set(i, gameResponse.playerHands[i])
            console.log("tabla")
            this.playerTables.set(i, gameResponse.playerTables[i])
            console.log("score")
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        // this.playerHands.set(0,gameResponse.playerHands[0])
        // this.playerTables.set(0,gameResponse.playerTables[0])
        // this.playerScores.set(0,gameResponse.playerScores[0])

        console.log("nakon settovanja")
        console.log(this.deck)
        console.log(this.graveyard)
        console.log(this.playerHands)
        console.log(this.playerTables)
        console.log(this.playerScore)

        // console.log("uzmianje jednog kuraca")
        // const cardsForPlayer0 = this.playerHands.get(0);
        // console.log(cardsForPlayer0)


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

    getMapSize(map: Map<number, string[]>): number{
        let size = 0;
        for (const i in map){
            size++
        }
        return size
    }

}
