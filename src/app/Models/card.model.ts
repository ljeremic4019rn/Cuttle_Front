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
