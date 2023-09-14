import {
    AfterViewChecked,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnInit,
    Renderer2,
    SimpleChanges, ViewChild
} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RoomService} from "../../../services/room.service";
import {GameAction} from "../../../Models/room.model";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {CardDto, DropZoneCords} from "../../../Models/card.model";
import {CdkDragEnd, CdkDragMove} from "@angular/cdk/drag-drop";
import {parse} from "@angular/compiler/src/render3/view/style_parser";

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
    testInputAction: string
    gameAction: GameAction
    myPlayerNumber: number = -1
    dropZoneCordsMap: Map<string, DOMRect> = new Map<string, DOMRect>()
    filteredDomTreeElements: Element[] = []
    graveyardCardsAreSelectable: boolean = false
    selectedPlayerToDiscard: number = -1

    //visuals
    cardPositionOnScreen: string [] = []
    visible: boolean[] = []
    graveyardVisible: boolean = false
    selectArrowVisible: boolean = false

    timer = 60


    constructor(private router: Router, private route: ActivatedRoute, public gameEngineService: GameEngineService, private roomService: RoomService) {
        // this.roomKey = ''
        this.testInputAction = ''
        this.gameAction = {
            roomKey: "",
            actionType: "",
            fromPlayer: -1,
            cardPlayed: "",
            ontoPlayer: -1,
            ontoCardPlayed: "",
            helperCardList: []
        }

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

        // this.dropZoneCordsMap.set("table-3", {left: 0, right: 0, top: 0, bottom: 0})
    }

    ngAfterViewChecked(): void {
        if(this.gameEngineService.forced7Card){
            this.highlightCard(this.gameEngineService.forced7Card!)
        }
    }

    date: any;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.gameAction.roomKey = params.get('key')!;
        });
        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        this.setPlayerPositions()
        this.connect()

        this.myPlayerNumber = parseInt(sessionStorage.getItem("myPlayerNumber")!)
        for (let i = 0; i < this.gameEngineService.numberOfPlayers; i++) {
            this.visible[i] = true
        }

        //todo this.setTimer()


        //todo page reload block - VRATI GA KASNIJE
        // window.onbeforeunload = function (e) {
        //     return e.returnValue = 'Are you sure you want to leave this page?';
        // };
    }




    //GAME ENGINE

    setTimer(){
        setInterval(() => {
            if (this.timer == 0) {
                this.sendGameAction()
                this.timer = 60
            }
            else this.timer--
        }, 1000);
    }

    draw(){
        if(this.myPlayerNumber != this.gameEngineService.currentPlayersTurn){
            alert("It is not your turn")
            return
        }
        this.setGameAction("DRAW", "", "", -1, [])
        this.sendGameAction()
        console.log("clicked on the deck")
    }

    openGraveyard(){
        this.graveyardVisible = true
    }

    closeGraveyard(){
        this.graveyardVisible = false
    }

    endTurn(){
        this.sendGameAction()
    }


    sendGameAction() {
        console.log("SALJEMO NA SERVER")
        console.log(this.gameAction)
        if(this.gameAction.actionType == ""){
            alert("AN ERROR OCCURRED - ACTION TYPE EMPTY")
            return
        }
        this.stompClient.send(
            `/app/playAction`,
            {},
            JSON.stringify(this.gameAction)
        );
        this.gameAction.actionType = ""
    }

    setGameAction(actionType: string, cardPlayed: string, ontoCardPlayed:string, onToPlayer: number, helperCardList: []){
        this.gameAction.fromPlayer = this.gameEngineService.currentPlayersTurn
        this.gameAction.actionType = actionType
        this.gameAction.cardPlayed = cardPlayed
        this.gameAction.ontoCardPlayed = ontoCardPlayed
        this.gameAction.ontoPlayer = onToPlayer
        this.gameAction.helperCardList = helperCardList
    }

    getOppositePlayer(): number{
        if (this.myPlayerNumber == 0) return 1
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


    //POWER CARD FUNCTIONS (AND CARD DRAG FUNCTIONS)

    cdkDragStartedFun(){
        this.getDropZoneCoordinates() //todo ovo mozda nije najbolje mesto ali ne znam gde pametnije
    }

    cdkDragStoppedFun(cardDto: CardDto){
        // this.deactivateDropZoneBorders()

        //if it's not my turn - do nothing
        if(this.myPlayerNumber != this.gameEngineService.currentPlayersTurn){
            cardDto.event.source._dragRef.reset()
            return
        }

        const playedCardSplit = cardDto.card.split("_")
        const droppedLocationInfo = this.getWhereCardIsDropped(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y).split("-")//split if for parsing dom tree id

        if (this.gameEngineService.forced7Card != null && cardDto.card != this.gameEngineService.forced7Card){
            this.highlightCard(this.gameEngineService.forced7Card!)
            alert("You have to play a designated card given by the 7 power card")
        }

        if (droppedLocationInfo[0] == "center"){//play global magic card
            //if a target specific card is played as a global just ignore it
            if (this.listContainCardCheck(playedCardSplit[0], ["2", "9", "10", "J"])){
                alert("Can't play target specific magic card as global")
                cardDto.event.source._dragRef.reset()
                return
            }
            this.setGameAction("POWER", cardDto.card,"", this.myPlayerNumber, [])
            this.powerCardEventHelper(playedCardSplit[0], "", cardDto.card, -1, cardDto.event) //if its a special card like 4 or 7, do some more magic
        }
        else if (droppedLocationInfo[0] == "table"){
            //its card on my table set as a point
            //if cards on enemy table, find hovered card and play magic on that card
            let enemyTablePositionNum = parseInt(droppedLocationInfo[1])

            if (enemyTablePositionNum == this.myPlayerNumber){//play a point on my field
                if (this.listContainCardCheck(playedCardSplit[0], ["J","Q","K"])) {
                    alert("Can't play power card as point")
                    cardDto.event.source._dragRef.reset()
                    return
                }
                this.setGameAction("NUMBER", cardDto.card, "", this.myPlayerNumber, [])
            }
            //todo 2 counter
            //todo reset arrows if 4 is not played somehow
            else {//play a magic card onto the enemy card
                let hoveredCard = this.getHoveredCard(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y, enemyTablePositionNum)
                this.setGameAction("SCUTTLE", cardDto.card, hoveredCard,  enemyTablePositionNum, []) //originally set scuttle, but if it's a 2/9/J it will change in the powerCardEventHelper
                this.powerCardEventHelper(playedCardSplit[0], hoveredCard, cardDto.card, enemyTablePositionNum, cardDto.event)
                //if it's still scuttle we need to check if the scuttle is valid
                if (this.gameAction.actionType == "SCUTTLE"){
                    let ontoPlayedCardSplit = hoveredCard.split("_")[0]
                    let playedCardValue = parseInt(playedCardSplit[0])
                    let ontoPlayedCardValue = parseInt(ontoPlayedCardSplit[0])

                    if (playedCardValue < ontoPlayedCardValue){
                        alert("You cant scuttle with a lesser value card")
                    }
                    else if (playedCardValue == ontoPlayedCardValue && this.cardSuitComparator(playedCardSplit[1], ontoPlayedCardSplit[1]) == "NOT_BIGGER"){
                        alert("You cant scuttle with a lesser or equal suit card")
                    }
                }
            }
        }
        else cardDto.event.source._dragRef.reset()

        console.log("FINAL")
        console.log(this.gameAction)
    }


    //just displaced code to make the main fun more compact
    powerCardEventHelper(playedCardSplit0: string, ontoPlayedCard: string,  playedCard: string, enemyTablePositionNum: number, event: CdkDragEnd) {
        switch (playedCardSplit0) {
            //GLOBAL POWER CARDS
            case "3":
                this.graveyardVisible = true
                this.graveyardCardsAreSelectable = true
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
            case "4":
                this.selectArrowVisible = true
                //todo display selection screen later
                this.setGameAction("POWER", playedCard, ontoPlayedCard, this.selectedPlayerToDiscard, [])

                if (this.gameEngineService.numberOfPlayers == 2){
                    this.gameAction.ontoPlayer = this.getOppositePlayer()
                }
                break
            case "8":
                this.gameEngineService.power8InAction++
                break

            //TARGET SPECIFIC POWER CARDS
            case "2":
                if (!this.listContainCardCheck(ontoPlayedCard.split("_")[0], ["J","Q","K","P"])) return; //if card hovered is not in list, it's not a power play
                if (ontoPlayedCard.split("_")[0] != "Q" &&  this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(enemyTablePositionNum)!)){
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])

                break
            case "9":
                if (!this.listContainCardCheck(ontoPlayedCard.split("_")[0], ["J","Q","K","P"])) return; //if card hovered is not in list, it's not a power play
                if (ontoPlayedCard.split("_")[0] != "Q" &&  this.listContainCardCheck("Q", this.gameEngineService.playerTables.get(enemyTablePositionNum)!)){
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard, enemyTablePositionNum, [])
                break
            case "J":
                if (this.listContainCardCheck("J", ["Q"])){
                    alert("Player has a queen in play")
                    event.source._dragRef.reset()
                    return
                }
                this.setGameAction("POWER", playedCard, ontoPlayedCard,enemyTablePositionNum, [])
                break
        }
    }

    selectGraveyardCard(selectedCard: string) {
        if (this.graveyardCardsAreSelectable) {
            this.gameAction.ontoCardPlayed = selectedCard
            this.sendGameAction()
            this.graveyardVisible = false
            this.graveyardCardsAreSelectable = false
        }
    }

    selectPlayerForCardDiscard(selectedPosition: string){
        this.cardPositionOnScreen.forEach((position, playerNum) => {
            if (selectedPosition == position){
                this.gameAction.ontoPlayer = playerNum
                this.sendGameAction()
                this.selectArrowVisible = false
            }
        });
    }

    //checks if the played card is one of the ones in the list
    //aka it checks if the card can be played at that specific spot, and if not "cancel" the play
    listContainCardCheck(cardToMatch: string, listToMatch: string[]): boolean{
        // console.log(listToMatch)
        // console.log(cardToMatch)
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
            if (this.isHovered(mouse_x, mouse_y, dropZone[1])){
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
    isHovered(mouse_x: number, mouse_y: number, boundingRect: DOMRect): boolean{
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




    //CONNECTIVITY

    connect() {
        const socket = new SockJS(`${environment.cuttleEngineServer}/ws?jwt=${sessionStorage.getItem('token')}`);
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({}, this.onConnect.bind(this));
    }

    onConnect(frame: any) {
        console.log("room key")
        console.log(this.gameAction.roomKey)

        this.stompClient.subscribe(`/cuttle/update/` + this.gameAction.roomKey, this.updateGameState.bind(this));
        this.isConnected = true;
        console.log('Connected: ' + frame);
    }

    updateGameState(newState: any) {
        this.gameEngineService.updateGameState((JSON.parse(newState.body)))
    }

    disconnect() {
        if (this.stompClient != null) {//todo if players == 0 close room and disconnect
            this.stompClient.disconnect();
        }
        this.isConnected = false;
        console.log("Disconnected");
    }



    //VISUALS

    input: string = ""
    highlightCard(card: string){
        const cardToHighlight = document.querySelector("#card-hand-" + card)
        if (cardToHighlight != null) cardToHighlight.classList.add("highlighted")
    }

    setDeckCardPosition(index: number): object{
        return {
            'transform': 'translate(-' + index/2 + '%, -' + index/2 + '%)'
        }
    }

    selectArrowStyle(): object{
        if(this.selectArrowVisible) return {'visibility': 'visible'}
        return {'visibility': 'hidden'}
    }

    setGraveyardCardPosition(index: number): object{
        return {
            'transform': 'translate(' + index/2 + '%, -' + index/2 + '%)'
        }
    }


    setPlayerPositions() {
        if (this.gameEngineService.numberOfPlayers == 2) {
            switch (this.myPlayerNumber) {
                case 0:
                    this.cardPositionOnScreen[0] = "bottom"
                    this.cardPositionOnScreen[1] = "top"
                    break
                case 1:
                    this.cardPositionOnScreen[0] = "top"
                    this.cardPositionOnScreen[1] = "bottom"
                    break
            }
        }
        else if (this.gameEngineService.numberOfPlayers == 3) {
            switch (this.myPlayerNumber) {
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
        }
        else if (this.gameEngineService.numberOfPlayers == 4) {
            switch (this.myPlayerNumber) {
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
                    this.cardPositionOnScreen[1] = "1op"
                    this.cardPositionOnScreen[2] = "right"
                    this.cardPositionOnScreen[3] = "bottom"
                    break
            }
        }
    }

}
