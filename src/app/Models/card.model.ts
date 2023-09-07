import {CdkDragEnd} from "@angular/cdk/drag-drop";

export interface Card {
    name: string;
    value: number;
    suit: Suit;
}

export enum Suit {
    Club = 'club',
    Diamond = 'diamond',
    Heart = 'heart',
    Spade = 'spade',
}

export interface CardDto{
    event: CdkDragEnd;
    card: string;
}

export interface AllDropZoneCords{
    center: DropZoneCords
    table0: DropZoneCords
    table1: DropZoneCords
    table2: DropZoneCords
    table3: DropZoneCords
}

export interface DropZoneCords{
    left: number;
    right: number;
    top: number;
    bottom: number;
}
