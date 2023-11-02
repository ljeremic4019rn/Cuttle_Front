import {AfterViewChecked, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {CardDto} from "../../../Models/card.model";
import {CdkDragEnd} from "@angular/cdk/drag-drop";

@Component({
    selector: 'app-room',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, AfterViewChecked {

    //connectivity
    // @ts-ignore
    stompClient: CompatClient;
    isConnected: boolean = false;

    //game engine
    dropZoneCordsMap: Map<string, DOMRect> = new Map<string, DOMRect>()
    filteredDomTreeElements: Element[] = []
    graveyardCardsAreSelectable: boolean = false
    selectedPlayerToDiscard: number = -1
    selectedCardsForDiscard: string [] = []

    //visuals
    cardPositionOnScreen: string [] = []
    visible: boolean[] = []
    graveyardVisible: boolean = false
    selectArrowVisible: boolean = false
    arrowVisible: boolean = true
    actionPlayed: boolean = false

    //timer
    timerInterval: any; //todo ovo se moze kasnije iskoristiti za pause game on unload

    constructor(private router: Router, private route: ActivatedRoute, public gameEngineService: GameEngineService) {
        this.cardPositionOnScreen[0] = "bottom"
        this.cardPositionOnScreen[1] = "left"
        this.cardPositionOnScreen[2] = "top"
        this.cardPositionOnScreen[3] = "right"

        this.visible[0] = false
        this.visible[1] = false
        this.visible[2] = false
        this.visible[3] = false

        this.dropZoneCordsMap.set("center", new DOMRect())
        this.dropZoneCordsMap.set("table-0", new DOMRect())
        this.dropZoneCordsMap.set("table-1", new DOMRect())
        this.dropZoneCordsMap.set("table-2", new DOMRect())
        this.dropZoneCordsMap.set("table-3", new DOMRect())

    }

    ngAfterViewChecked(): void {
        if (this.gameEngineService.forced7Card) {
            this.highlightCard("#card-hand-" + this.gameEngineService.forced7Card!)
        }
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.gameEngineService.gameAction.roomKey = params.get('key')!;
            this.gameEngineService.visualUpdate.roomKey = params.get('key')!;
        });
        this.gameEngineService.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        this.setPlayerPositions()
        this.connect()

        this.gameEngineService.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        for (let i = 0; i < this.gameEngineService.numberOfPlayers; i++) {
            this.visible[i] = true
        }

        this.setTimer()

        // window.onbeforeunload = function (e) {//todo return this warning
        //     return e.returnValue = 'Are you sure you want to leave this page?';
        // };
    }


    //POWER CARD FUNCTIONS (AND CARD DRAG FUNCTIONS)

    cdkDragStartedFun() {
        if (this.selectArrowVisible) this.selectArrowVisible = false
        this.getDropZoneCoordinates()
    }

    //this happens when the card is dropped (action played) and determines the action played
    cdkDragStoppedFun(cardDto: CardDto) {
        if (this.gameEngineService.myPlayerNumber != this.gameEngineService.currentPlayersTurn) {//if it's not my turn reset card, unless it's a counter card (2)
            if (cardDto.card.startsWith("2"))
                this.playCounterCard(cardDto.card, cardDto.event)
            else cardDto.event.source._dragRef.reset()
            return
        }
        if (cardDto.card.startsWith("2") && this.gameEngineService.gameAction.actionType == "COUNTER"){
            this.playCounterCard(cardDto.card, cardDto.event)
            return
        }

        const playedCardSplit = cardDto.card.split("_")
        const droppedLocationInfo = this.getWhereCardIsDropped(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y).split("-")//split if for parsing dom tree id
        this.actionPlayed = false

        if (this.gameEngineService.forced7Card != null && cardDto.card != this.gameEngineService.forced7Card) {
            this.highlightCard("#card-hand-" + this.gameEngineService.forced7Card!)
            alert("You have to play a designated card given by the 7 power card")
        }

        //CENTER
        if (droppedLocationInfo[0] == "center") {
            this.actionPlayed = true
            if (playedCardSplit[0] != "1" && this.listContainCardCheck(playedCardSplit[0], ["2", "9", "10", "J"])) { //if a target specific card is played as a global just ignore it
                alert("Can't play target specific magic card as global")
                cardDto.event.source._dragRef.reset()
                this.actionPlayed = false
                return
            }
            this.setGameAction("POWER", cardDto.card, "", this.gameEngineService.myPlayerNumber, [])
            this.globalPowerCardEventHelper(playedCardSplit[0], "", cardDto.card, -1) //if its a special card like 4 or 7, do some more magic
        }
        //TABLE
        else if (droppedLocationInfo[0] == "table") {
            let enemyTablePositionNum = parseInt(droppedLocationInfo[1])//if card on my table set as a point - if cards on enemy table, find hovered card and play magic on that card
            this.actionPlayed = true

            //MY TABLE
            if (enemyTablePositionNum == this.gameEngineService.myPlayerNumber) {//play a point on my field
                if (this.listContainCardCheck(playedCardSplit[0], ["J", "Q", "K"])) {
                    alert("Can't play power card as point")
                    cardDto.event.source._dragRef.reset()
                    this.actionPlayed = false
                    return
                }
                this.setGameAction("NUMBER", cardDto.card, "", this.gameEngineService.myPlayerNumber, [])
            }
            //ENEMY TABLE
            else {//play a magic card onto the enemy card
                let hoveredCard = this.getHoveredCard(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y, enemyTablePositionNum)
                this.setGameAction("SCUTTLE", cardDto.card, hoveredCard, enemyTablePositionNum, [])

                //originally set scuttle, but if it's a 2/9/J it will change in the powerCardEventHelper!!!
                this.targetedPowerCardEventHelper(playedCardSplit[0], hoveredCard, cardDto.card, enemyTablePositionNum, cardDto.event)

                if (this.gameEngineService.gameAction.actionType == "SCUTTLE") {//if it's still scuttle we need to check if the scuttle is valid
                    let ontoPlayedCardSplit = hoveredCard.split("_")[0]
                    let playedCardValue = parseInt(playedCardSplit[0])
                    let ontoPlayedCardValue = parseInt(ontoPlayedCardSplit[0])

                    if (ontoPlayedCardSplit[0] == "Q" || ontoPlayedCardSplit[0] == "K"){
                        alert("You cant scuttle a permanent effect card")
                        cardDto.event.source._dragRef.reset()
                        this.actionPlayed = false
                        return
                    }

                    if (playedCardValue < ontoPlayedCardValue) {
                        alert("You cant scuttle with a lesser value card")
                        cardDto.event.source._dragRef.reset()
                        this.actionPlayed = false
                        return
                    }
                    else if (playedCardValue == ontoPlayedCardValue && this.cardSuitComparator(playedCardSplit[1], ontoPlayedCardSplit[1]) == "NOT_BIGGER") {
                        alert("You cant scuttle with a lesser or equal suit card")
                        cardDto.event.source._dragRef.reset()
                        this.actionPlayed = false
                        return
                    }
                }
            }
        }
        else {
            cardDto.event.source._dragRef.reset()
        }

        if (this.actionPlayed){//if card was not set randomly on the table but on a good drop zone
            this.setDataForVisualSocketUpdate()
            this.sendVisualUpdate()

            console.log("POSLALI SMO GOVNO")

            this.gameEngineService.timer = this.gameEngineService.endOfRoundTime
            this.disableCardDrag(cardDto.card)

            console.log("FINAL")
            console.log(this.gameEngineService.gameAction)
        }
    }

    //just displaced code to make the main fun more compact
    globalPowerCardEventHelper(playedCardSplit0: string, ontoPlayedCard: string, playedCard: string, enemyTablePositionNum: number) {
        switch (playedCardSplit0) {
            //GLOBAL POWER CARDS
            case "3":
                if (this.gameEngineService.graveyard.length == 0) {
                    alert("Nothing in graveyard yet")
                    this.actionPlayed = false
                    return
                }
                this.pauseTimer()
                this.graveyardVisible = true
                this.graveyardCardsAreSelectable = true
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
            case "4":
                this.selectArrowVisible = true

                if (this.gameEngineService.numberOfPlayers == 2) {
                    this.gameEngineService.gameAction.ontoPlayer = this.getOppositePlayer()
                    this.selectedPlayerToDiscard = this.getOppositePlayer()
                }

                //if player has <= 2 cards then just discard them else give him the choice to pick which cards to discard (using visual update and socket)
                if (this.gameEngineService.playerHands.get(this.selectedPlayerToDiscard)!.length <= 2)
                    this.setGameAction("POWER", playedCard, ontoPlayedCard, this.selectedPlayerToDiscard, [])
                else this.setGameAction("SELECT_TO_DISCARD", playedCard, ontoPlayedCard, this.selectedPlayerToDiscard, [])

                break
            case "8":
                this.gameEngineService.power8Preparation = true
                break
        }
    }

    //just displaced code to make the main fun more compact
    targetedPowerCardEventHelper(playedCardSplit0: string, ontoPlayedCard: string, playedCard: string, enemyTablePositionNum: number, event: CdkDragEnd) {
        switch (playedCardSplit0) {
            //TARGET SPECIFIC POWER CARDS
            case "2":
                if (!this.listContainCardCheck(ontoPlayedCard.split("_")[0], ["J", "Q", "K", "P"])) return; //if card hovered is not in list, it's not a power play
                if (ontoPlayedCard.split("_")[0] != "Q" && this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(enemyTablePositionNum)!)) {
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    this.actionPlayed = false
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
            case "9":
                if (!this.listContainCardCheck(ontoPlayedCard.split("_")[0], ["J", "Q", "K", "P"])) return; //if card hovered is not in list, it's not a power play
                if (ontoPlayedCard.split("_")[0] != "Q" && this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(enemyTablePositionNum)!)) {
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    this.actionPlayed = false
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
            case "J":
                if (ontoPlayedCard.split("_")[0] != "Q" && this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(enemyTablePositionNum)!)) {
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    this.actionPlayed = false
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
        }
    }

    selectGraveyardCard(selectedCard: string) {
        if (this.graveyardCardsAreSelectable) {
            this.gameEngineService.gameAction.ontoCardPlayed = selectedCard
            this.setTimer()
            this.graveyardVisible = false
            this.graveyardCardsAreSelectable = false
        }
    }

    selectCardForDiscard(selectedCard: string) {
        if (this.selectedCardsForDiscard[0] == selectedCard) return
        this.selectedCardsForDiscard.push(selectedCard)

        this.highlightCard("#card-discard-" + selectedCard)

        if (this.selectedCardsForDiscard.length == 2) {
            this.setGameAction("POWER", this.gameEngineService.visualUpdate.cardPlayed, "", this.gameEngineService.visualUpdate.ontoPlayer, this.selectedCardsForDiscard)
            this.gameEngineService.gameAction.fromPlayer = this.gameEngineService.visualUpdate.fromPlayer
            this.gameEngineService.currentPlayersTurn = this.gameEngineService.myPlayerNumber
            this.sendGameAction()

            this.gameEngineService.discardSelectionVisible = false
            this.selectedCardsForDiscard = []
        }
    }

    selectPlayerForCardDiscard(selectedPosition: string) {
        this.cardPositionOnScreen.forEach((position, playerNum) => {
            if (selectedPosition == position) {
                this.gameEngineService.gameAction.ontoPlayer = playerNum
                this.sendGameAction()
                this.selectArrowVisible = false
            }
        });
    }

    //checks if the played card is one of the ones in the list
    //aka it checks if the card can be played at that specific spot, and if not "cancel" the play
    listContainCardCheck(cardToMatch: string, listToMatch: string[]): boolean {
        console.log(cardToMatch)
        console.log(listToMatch)
        for (let i = 0; i < listToMatch.length; i++) {
            console.log(cardToMatch + "   " + listToMatch[i])
            if (listToMatch[i].startsWith(cardToMatch)) {
                // console.log("FOUND THE CARD IN LIST")
                return true
            }
        }
        return false
    }


    //if card is dropped on en enemy players table find which card it has been dropped on
    getHoveredCard(mouse_x: number, mouse_y: number, playerTable: number): string {
        this.filteredDomTreeElements = this.filterDOMElementIds(document.querySelectorAll("*"), "card-table")
        for (let card of this.filteredDomTreeElements) {
            let cardSplit = card.id.split("-")
            if (parseInt(cardSplit[2]) == playerTable && this.isHovered(mouse_x, mouse_y, card.getBoundingClientRect())) {
                return cardSplit[3]
            }
        }
        return "FAIL"
    }

    //get in which drop zone the cards has been dropped
    getWhereCardIsDropped(mouse_x: number, mouse_y: number): string {
        //dropZone[0] = key dropZone[1] = values
        for (let dropZone of Array.from(this.dropZoneCordsMap.entries())) {
            if (this.isHovered(mouse_x, mouse_y, dropZone[1])) {
                return dropZone[0]
            }
        }
        return "FAIL"
    }

    //get ids of all droppable zones (center and player tables)
    //this is dynamic because if the player changed the screen size it will change the droppable zone cords
    getDropZoneCoordinates() {
        this.dropZoneCordsMap.set("center", document.querySelector('#center')!.getBoundingClientRect())
        for (let i = 0; i < this.gameEngineService.numberOfPlayers; i++) {
            this.dropZoneCordsMap.set("table-" + i, document.querySelector('#table-' + i)!.getBoundingClientRect())
        }
    }

    //checks if the card bounds are around the mouse cursor when the card drag is finished
    isHovered(mouse_x: number, mouse_y: number, boundingRect: DOMRect): boolean {
        return boundingRect.left < mouse_x && boundingRect.right > mouse_x && boundingRect.top < mouse_y && boundingRect.bottom > mouse_y;
    }

    //find all html elements containing a certain word in id
    filterDOMElementIds(elements: NodeListOf<Element>, filterWord: string) {
        const filteredElements = [];
        for (const element of Array.from(elements)) {
            if (element.id && element.id.startsWith(filterWord)) {
                filteredElements.push(element);
            }
        }
        return filteredElements;
    }



    //HELPER GAME ENGINE FUNCTIONS

    setTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameEngineService.timer == 0) {
                this.sendGameAction()
            }
            else this.gameEngineService.timer--
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
    }

    disableCardDrag(handCard: string){
        let element = document.querySelector("#card-hand-" + handCard) as HTMLElement
        if (element) element.style.pointerEvents = "none";
    }

    playCounterCard(counterCard: string, event: CdkDragEnd){
        if (this.gameEngineService.timer > this.gameEngineService.endOfRoundTime){//janky way of blocking a "2 counter play" before the opponent has played something
            alert("A play has not been made yet")
            event.source._dragRef.reset()
            return
        }

        if(this.actionTypeIsNotPowerOrCounter()){
            alert("This play can not be countered")
            event.source._dragRef.reset()
            return
        }
        if (this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(this.gameEngineService.currentPlayersTurn)!)) {
            alert("Player has a queen in play")
            event.source._dragRef.reset()
            return
        }

        //we send to the server that a counter to the last card has been made
        this.gameEngineService.visualUpdate.actionType = "COUNTER"
        this.gameEngineService.visualUpdate.cardPlayed = counterCard
        this.gameEngineService.visualUpdate.fromPlayer = this.gameEngineService.myPlayerNumber
        this.sendVisualUpdate()
    }

    draw() {
        if (this.gameEngineService.myPlayerNumber != this.gameEngineService.currentPlayersTurn) {
            alert("It is not your turn")
            return
        }
        this.setGameAction("DRAW", "", "", -1, [])
        this.sendGameAction()
    }

    actionTypeIsNotPowerOrCounter(): boolean{
        const actionTypes: string[] = ["NUMBER", "SCUTTLE", "DISCARD_CARD", "DRAW", "SKIP", "SELECT_TO_DISCARD"];
        for (let type in actionTypes){
            if (this.gameEngineService.visualLastActionName == type) return true
        }
        return false
    }

    openGraveyard() {
        this.graveyardVisible = true
    }

    closeGraveyard() {
        this.graveyardVisible = false
    }

    sendVisualUpdate() {
        console.log("SALJEMO NA SERVER")
        console.log(this.gameEngineService.visualUpdate)

        if (this.gameEngineService.visualUpdate.actionType == "") {
            alert("AN ERROR OCCURRED - VISUAL ACTION TYPE EMPTY")
            return
        }

        this.stompClient.send(
            `/app/visualUpdate`,
            {},
            JSON.stringify(this.gameEngineService.visualUpdate)
        );
        this.gameEngineService.visualUpdate.actionType = ""
    }

    sendGameAction() {
        if (this.gameEngineService.currentPlayersTurn == this.gameEngineService.myPlayerNumber){
            if (this.gameEngineService.gameAction.actionType == "") {
                this.gameEngineService.gameAction.actionType = "SKIP"
                // alert("Turn skipped")
            }
            console.log("SALJEMO NA SERVER")
            console.log(this.gameEngineService.gameAction)
            this.stompClient.send(
                `/app/playAction`,
                {},
                JSON.stringify(this.gameEngineService.gameAction)
            );
            this.gameEngineService.gameAction.actionType = ""
        }
    }

    setGameAction(actionType: string, cardPlayed: string, ontoCardPlayed: string, onToPlayer: number, helperCardList: string[]) {
        this.gameEngineService.gameAction.fromPlayer = this.gameEngineService.currentPlayersTurn
        this.gameEngineService.gameAction.actionType = actionType
        this.gameEngineService.gameAction.cardPlayed = cardPlayed
        this.gameEngineService.gameAction.ontoCardPlayed = ontoCardPlayed
        this.gameEngineService.gameAction.ontoPlayer = onToPlayer
        this.gameEngineService.gameAction.helperCardList = helperCardList
    }

    getOppositePlayer(): number {
        if (this.gameEngineService.myPlayerNumber == 0) return 1
        else return 0
    }

    cardSuitComparator(playedCardSuit: string, ontoPlayedCardSuit: string): string {//check if left (played) iz bigger
        switch (playedCardSuit) {
            case "C":
                return "NOT_BIGGER"
            case "D":
                if (ontoPlayedCardSuit == "C") return "BIGGER";
                if (ontoPlayedCardSuit == "D") return "NOT_BIGGER";
                if (ontoPlayedCardSuit == "H") return "NOT_BIGGER";
                if (ontoPlayedCardSuit == "S") return "NOT_BIGGER";
                break
            case "H" :
                if (ontoPlayedCardSuit == "C") return "BIGGER";
                if (ontoPlayedCardSuit == "D") return "BIGGER";
                if (ontoPlayedCardSuit == "H") return "NOT_BIGGER";
                if (ontoPlayedCardSuit == "S") return "NOT_BIGGER";
                break
            case "S" :
                if (ontoPlayedCardSuit == "C") return "BIGGER";
                if (ontoPlayedCardSuit == "D") return "BIGGER";
                if (ontoPlayedCardSuit == "H") return "BIGGER";
                if (ontoPlayedCardSuit == "S") return "NOT_BIGGER";
                break
        }
        return "NOT_BIGGER";
    }


    //CONNECTIVITY

    connect() {
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${sessionStorage.getItem('token')}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        console.log("room key")
        console.log(this.gameEngineService.gameAction.roomKey)

        this.stompClient.subscribe(`/cuttle/update/` + this.gameEngineService.gameAction.roomKey, this.updateGameState.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    updateGameState(newState: any) {
        this.gameEngineService.updateGameState((JSON.parse(newState.body)))
    }

    gameOverFun(){
        this.disconnect()
        this.router.navigate(["setUpRoom"]);
    }

    disconnect() {
        if (this.stompClient != null) {//todo if players == 0 close room and disconnect
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }


    //VISUALS

    // highlightCard(cardId: string) {
    //     const cardToHighlight = document.querySelector("#card-hand-" + cardId)
    //     if (cardToHighlight != null) cardToHighlight.classList.add("highlighted")
    // }
    highlightCard(cardId: string) {
        const cardToHighlight = document.querySelector(cardId)

        console.log("KUACCCCCC")
        console.log(cardToHighlight)
        if (cardToHighlight != null) cardToHighlight.classList.add("highlighted")
    }

    setDeckCardPosition(index: number): object {
        return {'transform': 'translate(-' + index / 2 + '%, -' + index / 2 + '%)'}
    }

    selectArrowStyle(): object {
        if (this.selectArrowVisible) return {'visibility': 'visible'}
        return {'visibility': 'hidden'}
    }

    setGraveyardCardPosition(index: number): object {
        return {'transform': 'translate(' + index / 2 + '%, -' + index / 2 + '%)'}
    }


    setPlayerPositions() {
        if (this.gameEngineService.numberOfPlayers == 2) {
            switch (this.gameEngineService.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "top"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "bottom"
                    break
            }
        } else if (this.gameEngineService.numberOfPlayers == 3) {
            switch (this.gameEngineService.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "left"
                    this.cardPositionOnScreen[2] = "top"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "bottom"
                    this.cardPositionOnScreen[2] = "left"
                    break
                case 2:
                    this.cardPositionOnScreen[0] = "left"
                    this.cardPositionOnScreen[1] = "top"
                    this.cardPositionOnScreen[2] = "bottom"
                    break
            }
        } else if (this.gameEngineService.numberOfPlayers == 4) {
            switch (this.gameEngineService.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "left"
                    this.cardPositionOnScreen[2] = "top"
                    this.cardPositionOnScreen[3] = "right"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "right"
                    this.cardPositionOnScreen[1] = "bottom"
                    this.cardPositionOnScreen[2] = "left"
                    this.cardPositionOnScreen[3] = "top"
                    break
                case 2:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "right"
                    this.cardPositionOnScreen[2] = "bottom"
                    this.cardPositionOnScreen[3] = "left"
                    break
                case 3:
                    this.cardPositionOnScreen[0] = "left"
                    this.cardPositionOnScreen[1] = "top"
                    this.cardPositionOnScreen[2] = "right"
                    this.cardPositionOnScreen[3] = "bottom"
                    break
            }
        }
    }

    highlightCurrentPlayer(index: number):object{
        if (this.gameEngineService.currentPlayersTurn == index){
            return {'border-color': 'yellow'}
        }
        else return {}
    }

    visualUpdateCardsStyle(): object {
        this.arrowVisible = true

        if (this.gameEngineService.visualUpdate.actionType == "NUMBER") {
            switch (this.gameEngineService.currentPlayersTurn) {
                case 0:return this.getCardPosition(this.cardPositionOnScreen[0])
                case 1:return this.getCardPosition(this.cardPositionOnScreen[1])
                case 2:return this.getCardPosition(this.cardPositionOnScreen[2])
                case 3:return this.getCardPosition(this.cardPositionOnScreen[3])
            }
        }
        return {}
    }

    getCardPosition(position: string): object{
        switch (position){
            case "top":
                return {
                    'position': 'absolute',
                    'bottom': '56%',
                    'left': '30%',
                    'transform': 'rotate(180deg)'
                }
            case "left":
                return {
                    'position': 'absolute',
                    'bottom': '23%',
                    'left': '27%',
                    'transform': 'translate(-50%, -50%) rotate(90deg)'
                }
            case "right":
                return {
                    'position': 'absolute',
                    'bottom': '50%',
                    'right': '27%',
                    'transform': 'translate(50%, -50%) rotate(-90deg)'
                }
            default: return {}
        }
    }


    setDataForVisualSocketUpdate() {
        this.gameEngineService.visualUpdate.visualUpdate = true
        this.gameEngineService.visualUpdate.fromPlayer = this.gameEngineService.currentPlayersTurn
        this.gameEngineService.visualUpdate.cardPlayed = this.gameEngineService.gameAction.cardPlayed
        this.gameEngineService.visualUpdate.actionType = this.gameEngineService.gameAction.actionType
        this.gameEngineService.visualUpdate.ontoCardPlayed = this.gameEngineService.gameAction.ontoCardPlayed
        this.gameEngineService.visualUpdate.ontoPlayer = this.gameEngineService.gameAction.ontoPlayer
    }

}
