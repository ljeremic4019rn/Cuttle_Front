export interface Room {
    key: string
}

export interface GameAction {
    roomKey: string
    actionType: string //POWER, NUMBER, SCUTTLE, COUNTER, DISCARD_CARD, DRAW
    fromPlayer: number
    cardPlayed: string
    ontoPlayer: number
    ontoCardPlayed: string
    helperCardList: []
}

export interface GameResponse{
    gameResponseType: string
    currentPlayersTurn: number
    deck: []
    graveyard: []
    playerHands: Map<number, []>
    playerTables: Map<number, []>
    playerScore: Map<number, number>
    playerWhoWon: number
}

export interface RoomUpdateResponse{
    roomUpdateType: string
    currentPlayersInRoom: string[]
    gameResponse: GameResponse
}

