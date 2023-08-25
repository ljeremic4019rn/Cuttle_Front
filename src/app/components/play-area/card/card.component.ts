import { Component, Input } from '@angular/core';
import {Card} from "../../../Models/card.model";

@Component({
    selector: 'doc-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css']
})
export class CardComponent {

    @Input()
    public card: Card | any;

    constructor() { }

}
