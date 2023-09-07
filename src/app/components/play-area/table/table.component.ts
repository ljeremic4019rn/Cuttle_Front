import {Component, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {RoomService} from "../../../services/room.service";
import {GameAction} from "../../../Models/room.model";
import * as SockJS from "sockjs-client";
import {environment} from "../../../../environments/environment";
import {CompatClient, Stomp} from "@stomp/stompjs";
import {GameEngineService} from "../../../services/game-engine.service";
import {CardDto, DropZoneCords} from "../../../Models/card.model";

@Component({
    selector: 'app-room',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

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

    //visuals
    cardPositionOnScreen: string [] = []
    visible: boolean[] = []
    dropAreasBorder: string = 'border: 5px dashed rgba(169, 169, 169, 0.0)'
    centerDropAreaBorder: string = 'border: 5px dashed rgba(0, 204, 255, 0.0)'


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

        //todo page reload block - VRATI GA KASNIJE

        // window.onbeforeunload = function (e) {
        //     return e.returnValue = 'Are you sure you want to leave this page?';
        // };
    }




    //GAME ENGINE

    draw(){
        //todo send draw action
        console.log("clicked on the deck")
    }

    lookIntoGraveyard(){
        console.log("clicked on the graveyard")
    }

    sendAction() {
        console.log("sending to this room key")
        console.log(this.gameAction.roomKey)

        this.stompClient.send(
            `/app/playAction`,
            {},
            JSON.stringify(this.gameAction)
        );
    }

    endTurn(){

    }

    playPoint(){

    }

    playCenterAction(){

    }

    playActionOnEnemy(){

    }

    counterAction(){

    }



    //CARD DRAG FUNCTIONS

    cdkDragStartedFun(){
        this.activateDropZoneBorders()

        this.getDropZoneCords() //todo skloni ovo odavde i stavi ga negde pametnije
    }


    /*
    todo

    kada se baci na svoj teren aktiviraj playPoint f koja namesti POINT kaciju u game action

    centar je samo magic ali obradi vrstu karte

    enemy je isto samo magic ali obrati na sta je bacena i da li moze da prodje

    ! smisli kako ce da se counteruje 2

    !smisli kako ce 7 da radi

    napravi spec model karte (-90deg) kada je na terenu kralj/dama/p8

     */

    cdkDragStoppedFun(cardDto: CardDto){
        this.deactivateDropZoneBorders()

        const dropped = this.getWhereCardIsDropped(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y).split("-")

        if (dropped[0] == "center"){
            //aktiviraj magiju ako moze
            console.log("center")

            //todo sendAction
        }
        else if (dropped[0] == "table"){
            let tableNum = parseInt(dropped[1])

            if (tableNum == this.myPlayerNumber){
                console.log("my table")
                //stavi mi poen
            }
            else {
                console.log(dropped[1] + " enemy table")
                //uardi akciju na enemy playera
                let hoveredCard = this.getHoveredCard(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y, tableNum)
                console.log("hovering above " + hoveredCard)
            }

            //todo sendAction
        }
        else {
            cardDto.event.source._dragRef.reset()
        }
    }


    //if card is dropped on en enemy players table find which card it has been dropped on
    getHoveredCard(mouse_x: number, mouse_y: number, playerTable: number): string {
        this.filteredDomTreeElements = this.filterElementIds(document.querySelectorAll("*"), "card-table")
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
    getDropZoneCords() {
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
    filterElementIds(elements: NodeListOf<Element>, filterWord: string) {
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

    calculateDeckVisualSize(){
        //todo umesto ovoga samo koristi pravi dek ali uradi i/3 ili tako nesto
    }

    setDeckCardPosition(index: number): object{
        return {
            'transform': 'translate(-' + index/2 + '%, -' + index/2 + '%)'
        }
    }

    setGraveyardCardPosition(index: number): object{
        return {
            'transform': 'translate(' + index/2 + '%, -' + index/2 + '%)'
        }
    }

    activateDropZoneBorders(){
        this.dropAreasBorder = 'border: 5px dashed rgba(169, 169, 169, 0.7)'
        this.centerDropAreaBorder = 'border: 5px dashed rgba(0, 204, 255, 0.7)'
    }

    deactivateDropZoneBorders(){
        this.dropAreasBorder = 'border: 5px dashed rgba(169, 169, 169, 0.0)'
        this.centerDropAreaBorder = 'border: 5px dashed rgba(0, 204, 255, 0.0)'
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
