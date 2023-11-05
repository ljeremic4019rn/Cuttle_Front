import {Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2} from '@angular/core';
import {RoomService} from "../services/room.service";
import {GameEngineService} from "../services/game-engine.service";
import {CardDto} from "../Models/card.model";

@Component({
  selector: 'app-end-screen',
  templateUrl: './end-screen.component.html',
  styleUrls: ['./end-screen.component.css']
})
export class EndScreenComponent implements OnInit {

    @Output()
    gameOverEmitter = new EventEmitter<any>();

    @Output()
    restartEmitter = new EventEmitter<any>();

    constructor(public gameEngineService: GameEngineService) {}


  ngOnInit(): void {
  }

    endGame(){
        this.gameOverEmitter.emit();
    }

    startOver(){
        this.restartEmitter.emit();
    }
}
