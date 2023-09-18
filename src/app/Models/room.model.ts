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
    helperCardList: string[]
}

export interface GameVisualUpdate {
    roomKey: string
    actionType: string //VISUAL
    visualUpdate: boolean
    fromPlayer: number
    cardPlayed: string
    ontoPlayer: number
    ontoCardPlayed: string
}


export interface GameResponse{
    gameResponseType: string
    currentPlayersTurn: number
    deck: []
    graveyard: []
    playerHands: Map<number, []>
    playerTables: Map<number, []>
    playerScore: Map<number, number>
    playerWhoWon: string
}

export interface RoomUpdateResponse{
    roomUpdateType: string
    currentPlayersInRoom: string[]
    gameResponse: GameResponse
}

