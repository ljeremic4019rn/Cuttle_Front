import {Injectable} from '@angular/core';
import {RoomService} from "./room.service";
import {GameAction, GameVisualUpdate} from "../Models/room.model";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    //server data
    public numberOfPlayers: number = 4 //todo vrati na 0
    public myPlayerNumber: number = -1
    public currentPlayersTurn: number = 0;
    public endOfRoundTime: number = 5
    public totalRoundTime: number = 100

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
    public lastCardPlayed: string = ""
    public baseCardWasCountered: boolean = false
    public power8InAction: number = 0
    public forced7Card: any = null

    // public cardsTestHand: string[] = ["1_C", "2_C", "3_C", "8_C"]
    // public cardsTestTable: string[] = ["1_D", "K_D", "Q_D", "4_D", "P_8_D", "J_S_0_J_H_2_J_C_1_J_D_2_10_D"]
    // public deckTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D"]
    // public graveYardTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]


    constructor(private roomService: RoomService) {
        this.playerHands.set(0, ["1_C", "2_C", "4_C", "5_C","6_C", "7_C", "8_C", "9_C","10_C", "J_C", "Q_C", "K_C"])
        this.playerHands.set(1, ["1_C", "2_C", "4_C", "8_C"])
        this.playerHands.set(2, ["1_C", "2_C", "3_C", "8_C"])
        this.playerHands.set(3, ["1_C", "2_C", "3_C", "8_C"])

        this.playerTables.set(0, ["1_C", "2_C","1_C", "2_C", "K_C", "Q_C"])
        this.playerTables.set(1, ["1_C", "2_C","3_C", "5_C", "8_C", "Q_C"])
        this.playerTables.set(2, ["1_C", "2_C","3_C", "5_C", "8_C", "Q_C"])
        this.playerTables.set(3, ["1_C", "2_C","1_C", "2_C", "3_C", "8_C"])

        // this.counterCards.push("2_H_1","2_C_2","2_D_3","2_S_0")

        this.deck = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]
        this.graveyard = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D"]

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
        if (gameResponse.visualUpdate) this.updateVisualsAndCounterPlays(gameResponse)
        else this.updateCardData(gameResponse)
    }

    updateVisualsAndCounterPlays(gameResponse: any) {
        this.visualUpdate = gameResponse

        if (this.myPlayerNumber == this.visualUpdate.fromPlayer) return

        if (this.visualUpdate.actionType == "COUNTER") {
            this.counterCards.push(this.visualUpdate.cardPlayed + "_" + this.visualUpdate.fromPlayer)

            if (this.lastCardPlayed.startsWith("2")){//if 2 counter was already played, we counter the 2 or base based od number of counters played
            }
            else {//we counter the base card
                this.baseCardWasCountered = true
            }
        }
        if (this.visualUpdate.actionType == "NUMBER"){

        }
        this.playedCardVisualAid[0] = this.visualUpdate.cardPlayed
        this.playedOntoCardVisualAid[0] = this.visualUpdate.ontoCardPlayed
        this.visualLastActionName = this.visualUpdate.actionType
        this.lastCardPlayed = this.visualUpdate.cardPlayed
    }

    updateCardData(gameResponse: any) {
        this.clearVisualHelperCards()

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

        if (gameResponse.gameResponseType == "SEVEN") {
            let handLength = gameResponse.playerHands[this.currentPlayersTurn].length
            this.forced7Card = gameResponse.playerHands[this.currentPlayersTurn][handLength - 1]
        }

        console.log("nakon UPDATE")//todo skloni ovo
        this.printAll()
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
