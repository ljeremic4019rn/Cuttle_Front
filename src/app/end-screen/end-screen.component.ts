import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {GameEngineService} from "../services/game-engine.service";

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

    constructor(public gameEngineService: GameEngineService) {
    }


    ngOnInit(): void {
    }

    endGame() {
        this.gameOverEmitter.emit();
    }

    startOver() {
        this.restartEmitter.emit();
    }
}
