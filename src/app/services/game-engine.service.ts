import {Injectable} from '@angular/core';
import {RoomService} from "./room.service";
import {GameVisualUpdate} from "../Models/room.model";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    public numberOfPlayers: number = 4 //todo vrati na 0
    public currentPlayersTurn: number = 0;
    public power8InAction: number = 0
    public forced7Card = null

    public deck: string[] = []
    public graveyard: string[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()

    public visualUpdate: GameVisualUpdate
    public phantomCenterCard: any = "1_C" //todo vrati na null
    public counterCards: string[] = []
    public ontoCardPlayed_x: number = 0
    public ontoCardPlayed_y: number = 0

    // public cardsTestHand: string[] = ["1_C", "2_C", "3_C", "8_C"]
    // public cardsTestTable: string[] = ["1_D", "K_D", "Q_D", "4_D", "P_8_D", "J_S_0_J_H_2_J_C_1_J_D_2_10_D"]
    // public deckTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D"]
    // public graveYardTest: string[] = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D","1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]


    constructor(private roomService: RoomService) {

        this.playerHands.set(0, ["1_C", "2_C", "4_C", "K_C"])
        this.playerHands.set(1, ["1_C", "2_C", "4_C", "8_C"])
        this.playerHands.set(2, ["1_C", "2_C", "3_C", "8_C"])
        this.playerHands.set(3, ["1_C", "2_C", "3_C", "8_C"])

        this.playerTables.set(0, ["1_C", "2_C","1_C", "2_C", "K_C", "Q_C"])
        this.playerTables.set(1, ["1_C", "2_C","1_C", "2_C", "K_C", "Q_C"])
        this.playerTables.set(2, ["1_C", "2_C","1_C", "2_C", "3_C", "Q_H"])
        this.playerTables.set(3, ["1_C", "2_C","1_C", "2_C", "3_C", "8_C"])

        this.deck = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D", "1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]
        this.graveyard = ["1_D", "2_D", "3_D", "4_D", "5_D", "4_D", "5_D", "4_D", "5_D", "4_D",]

        this.visualUpdate = {
            roomKey: "",
            actionType: "",
            visualUpdate: true,
            fromPlayer: -1,
            cardPlayed: "",
            ontoPlayer: -1,
            ontoCardPlayed: "",
            ontoCardPlayed_x: 0,
            ontoCardPlayed_y: 0,
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
        if (gameResponse.visualUpdate)
            this.updateVisuals(gameResponse)
        else this.updateCardData(gameResponse)
    }

    updateVisuals(gameResponse: any) {
        this.visualUpdate = gameResponse
        this.phantomCenterCard = this.visualUpdate.cardPlayed
        this.ontoCardPlayed_x = this.visualUpdate.ontoCardPlayed_x - 25
        this.ontoCardPlayed_y = this.visualUpdate.ontoCardPlayed_y - 70

        if (this.visualUpdate.actionType == "COUNTER") {
            this.counterCards.push(this.visualUpdate.cardPlayed)
        }

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
        this.phantomCenterCard = null
        this.counterCards = []
        this.ontoCardPlayed_x = 0
        this.ontoCardPlayed_y = 0
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
