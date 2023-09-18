import {Injectable} from '@angular/core';
import {RoomService} from "./room.service";
import {GameAction, GameVisualUpdate} from "../Models/room.model";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    //server data
    public numberOfPlayers: number = 0
    public myPlayerNumber: number = -1
    public currentPlayersTurn: number = 0;
    public gameOver:boolean = true
    public playerWhoWon: string = ""

    //timer
    public endOfRoundTime: number = 3
    public totalRoundTime: number = 60
    public timer: number = 0


    //card data
    public deck: string[] = []
    public graveyard: string[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()
    public gameAction: GameAction

    //vars for visual aid
    public visualUpdate: GameVisualUpdate
    public playedCardVisualAid:string [] = []
    public playedOntoCardVisualAid:string [] = []
    public visualLastActionName: string = ""

    //special card interaction data
    public counterCards: string[] = [] //<rank>_<suit>_<playerId> 2_S_3
    public power8InAction: boolean = false
    public forced7Card: any = null

    constructor() {
        //FOT TESTING
        // this.playerHands.set(0, ["1_C", "2_C","4_S",])
        // this.playerHands.set(1, ["2_H","2_D"])
        // this.playerHands.set(2, ["2_H","2_D"])
        // this.playerHands.set(3, ["1_C", "2_C", "3_C", "8_C"])
        //
        // this.playerTables.set(0, ["1_C", "2_C","1_C", "1_C"])
        // this.playerTables.set(1, ["1_C", "2_C","3_C", "5_C", "8_C", "Q_C"])
        // this.playerTables.set(2, ["1_C", "2_C","3_C", "5_C", "8_C", "Q_C"])
        // this.playerTables.set(3, ["1_C", "2_C","1_C", "2_C", "3_C", "8_C"])
        //
        // this.deck = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]
        // this.graveyard = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D"]

        this.gameAction = {
            roomKey: "",
            actionType: "",
            fromPlayer: -1,
            cardPlayed: "",
            ontoPlayer: -1,
            ontoCardPlayed: "",
            helperCardList: []
        }

        this.visualUpdate = {
            roomKey: "",
            actionType: "",
            visualUpdate: true,
            fromPlayer: -1,
            cardPlayed: "",
            ontoPlayer: -1,
            ontoCardPlayed: ""
        }
    }

    setUpGame(gameResponse: any) {
        // console.log(gameResponse);

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
        this.timer = this.totalRoundTime

        // console.log("nakon settovanja")
        // this.printAll()
    }


    updateGameState(gameResponse: any) {
        console.log("new state received from the server: ")
        console.log(gameResponse)
        if (gameResponse.visualUpdate) this.updateVisualsAndCounterPlays(gameResponse)
        else this.updateCardData(gameResponse)
    }

    updateVisualsAndCounterPlays(gameResponse: any) {
        this.visualUpdate = gameResponse
        this.timer = this.endOfRoundTime

        if (this.visualUpdate.actionType == "COUNTER") {
            if (this.counterCards.length == 0 || this.counterCards.length == 2)//if we have 0/2 counter cards in list we kill the base card, else we kill the counter
                this.gameAction.actionType = "COUNTER"                          //and the base power card goes through
            else this.gameAction.actionType = "POWER"
            this.counterCards.push(this.visualUpdate.cardPlayed + "_" + this.visualUpdate.fromPlayer)
            this.gameAction.helperCardList = this.counterCards
            return;
        }

        //if I played an action don't display visual aid for me
        if (this.myPlayerNumber == this.visualUpdate.fromPlayer) return
        this.playedCardVisualAid[0] = this.visualUpdate.cardPlayed
        this.playedOntoCardVisualAid[0] = this.visualUpdate.ontoCardPlayed
        this.visualLastActionName = this.visualUpdate.actionType
    }

    updateCardData(gameResponse: any) {
        if (gameResponse.gameResponseType == "GAME_OVER_WON") {
            console.log("THIS SHIT HIT")
            this.gameOver = true
            this.playerWhoWon = gameResponse.playerWhoWon
        }

        this.clearVisualHelperCards()
        this.forced7Card = null
        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        this.currentPlayersTurn = parseInt(gameResponse.currentPlayersTurn)
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, gameResponse.playerHands[i])
            this.playerTables.set(i, gameResponse.playerTables[i])
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        if (this.power8InAction){
            if (this.power8WasRemoved()) this.power8InAction = false
        }

        if (gameResponse.gameResponseType == "SEVEN") {
            let handLength = gameResponse.playerHands[this.currentPlayersTurn].length
            this.forced7Card = gameResponse.playerHands[this.currentPlayersTurn][handLength - 1]
        }
        this.timer = this.totalRoundTime

        // console.log("nakon UPDATE")
        // this.printAll()
    }

    power8WasRemoved():boolean{
        for (let i = 0; i < this.playerTables.size; i++) {
            for (let card of this.playerTables.get(i)!) {
                if (card.startsWith("P_8")) return false
            }
        }
        return true
    }

    clearVisualHelperCards() {
        this.playedCardVisualAid = []
        this.playedOntoCardVisualAid = []
        this.visualLastActionName = ""
        this.counterCards = []
    }

    getMapSize(map: Map<number, string[]>): number {
        let size = 0;
        for (const i in map) {
            size++
        }
        return size
    }

    printAll() {
        console.log(this.deck)
        console.log(this.graveyard)
        console.log(this.playerHands)
        console.log(this.playerTables)
        console.log(this.playerScore)
    }

}
