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

    //visuals
    cardPositionOnScreen: string [] = []
    visible: boolean[] = []
    borderActive: boolean = false
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

    //CARD DRAG FUNCTIONS

    filteredDomTreeElements: Element[] = []

    cdkDragStartedFun(){
        this.activateDropZoneBorders()

        //todo skloni ovo odavde i stavi ga negde pametnije
        this.getDropZoneCords()
        this.filteredDomTreeElements = this.filterElementIds(document.querySelectorAll("*"), "card")
    }

    cdkDragStoppedFun(cardDto: CardDto){
        this.deactivateDropZoneBorders()


        switch (this.getWhereCardIsDropped(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y)){
            case "center":
                console.log("center")
                break
            case "table-0":
                console.log("tab0")
                break
            case "table-1":
                console.log("tab1")
                break
            case "table-2":
                console.log("tab2")
                break
            case "table-3":
                console.log("tab3")
                break
            case "FAIL":
                cardDto.event.source._dragRef.reset()
                break
        }

        // this.doCardAction(cardDto.event.dropPoint.x, cardDto.event.dropPoint.y, cardDto.card)

    }


    doCardAction(mouse_x: number, mouse_y: number, draggedCard: string){
        // const allElements = document.querySelectorAll("*");
        // const filtered = this.filterElementIds(allElements, "card")

        let cardId

        for (let card of this.filteredDomTreeElements){
           cardId = card.id.split("-")

            if (cardId[1] == "row"){
                console.log("checking for table <---")

                if (this.isHovered(mouse_x, mouse_y, card.getBoundingClientRect())){
                    console.log("found a hovered card, its " + cardId[2])
                }
            }
        }
    }

    getWhereCardIsDropped(mouse_x: number, mouse_y: number): string {
        //dropZone[0] = key dropZone[1] = values
        for (let dropZone of Array.from(this.dropZoneCordsMap.entries())) {
            if (this.isHovered(mouse_x, mouse_y, dropZone[1])){
                return dropZone[0]
            }
        }
        return "FAIL"
    }

    //checks if the card bounds are around the mouse cursor when the card drag is finished
    isHovered(mouse_x: number, mouse_y: number, boundingRect: DOMRect): boolean{
        return boundingRect.left < mouse_x && boundingRect.right > mouse_x && boundingRect.top < mouse_y && boundingRect.bottom > mouse_y;
    }

    getDropZoneCords() {
        this.dropZoneCordsMap.set("center", document.querySelector('#center')!.getBoundingClientRect())
        for (let i = 0; i < this.gameEngineService.numberOfPlayers; i++) {
            this.dropZoneCordsMap.set("table-" + i, document.querySelector('#table-' + i)!.getBoundingClientRect())
        }
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
