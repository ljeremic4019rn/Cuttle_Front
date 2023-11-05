import {Injectable} from '@angular/core';
import {GameAction, GameVisualUpdate} from "../Models/room.model";

@Injectable({
    providedIn: 'root'
})
export class GameEngineService {

    //server data
    public numberOfPlayers: number = 0
    public myPlayerNumber: number = -1
    public currentPlayersTurn: number = 0;
    public gameOver: boolean = false
    public playerWhoWon: string = ""

    //card data
    public deck: string[] = []
    public graveyard: string[] = []
    public playerHands: Map<number, string[]> = new Map<number, string[]>()
    public playerTables: Map<number, string[]> = new Map<number, string[]>()
    public playerScore: Map<number, number> = new Map<number, number>()
    public gameAction: GameAction

    //vars for visual aid
    public visualUpdate: GameVisualUpdate
    public playedCardVisualAid: string [] = []
    public playedOntoCardVisualAid: string [] = []
    public visualLastActionName: string = ""
    public discardSelectionVisible: boolean = false

    //special card interaction data
    public counterCards: string[] = [] //<rank>_<suit>_<playerId> 2_S_3
    public power8Preparation: boolean = false;
    public power8InAction: boolean = false
    public forced7Card: any = null

    //timer
    public endOfRoundTime: number = 3
    public totalRoundTime: number = 60
    public timer: number = 0
    public timerInterval: any;

    constructor() {

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
        //just in case we clear the lists
        this.clearOldData()

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
    }


    //this game response format is fluid, it encompasses 3 forms
    //you know which one is based on the ifs
    updateGameState(gameResponse: any) {
        if (gameResponse.visualUpdate) this.updateVisualsAndCounterPlays(gameResponse)
        else if (gameResponse.roomUpdateType == "RESTART") this.setUpGame(gameResponse.gameResponse)
        else this.updateCardData(gameResponse)

    }

    updateVisualsAndCounterPlays(gameResponse: any) {
        this.visualUpdate = gameResponse

        if (this.visualUpdate.actionType == "SELECT_TO_DISCARD") {
            this.timer = this.totalRoundTime

            if (this.visualUpdate.ontoPlayer == this.myPlayerNumber) {
                this.discardSelectionVisible = true
            }
            return;
        }

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
            this.gameOver = true
            this.playerWhoWon = gameResponse.playerWhoWon
        }

        //clear old or helper data
        this.clearVisualHelperCards()
        this.forced7Card = null

        //set new game state
        this.deck = gameResponse.deck
        this.graveyard = gameResponse.graveyard
        this.currentPlayersTurn = parseInt(gameResponse.currentPlayersTurn)
        for (let i = 0; i < this.numberOfPlayers; i++) {
            this.playerHands.set(i, gameResponse.playerHands[i])
            this.playerTables.set(i, gameResponse.playerTables[i])
            this.playerScore.set(i, gameResponse.playerScore[i])
        }

        //deal with power 8 (un/covering cards)
        if (this.power8Preparation) {
            this.power8Preparation = false
            this.power8InAction = true //this throws error but too difficult to fix
        }
        if (this.power8InAction) {
            if (this.power8WasRemoved())
                this.power8InAction = false
        }

        //deal with 7 power (forcing player to play drawn card)
        if (gameResponse.gameResponseType == "SEVEN") {
            let handLength = gameResponse.playerHands[this.currentPlayersTurn].length
            this.forced7Card = gameResponse.playerHands[this.currentPlayersTurn][handLength - 1]
        }

        //set timer
        this.timer = this.totalRoundTime

        // console.log("nakon UPDATE")
        // this.printAll()
    }


    clearOldData() {
        this.gameOver = false
        this.playerWhoWon = ""

        this.deck = []
        this.graveyard = []
        this.playerHands.clear()
        this.playerTables.clear()
        this.playerScore.clear()
        this.counterCards = []
        this.power8InAction = false
        this.forced7Card = null

    }

    power8WasRemoved(): boolean {
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
