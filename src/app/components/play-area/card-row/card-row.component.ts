import { Component, OnInit } from '@angular/core';
import {Card} from "../../../Models/card.model";

@Component({
  selector: 'app-card-row',
  templateUrl: './card-row.component.html',
  styleUrls: ['./card-row.component.css']
})
export class CardRowComponent implements OnInit {

    cards: Card[]

  constructor() {
        this.cards = []
  }

  ngOnInit(): void {
  }




}
