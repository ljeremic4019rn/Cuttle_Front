export interface LoginResponse {
    token: string
}

export interface JoinRoomResponse{
    playerUsername: string
    playerNumber: number
    currentPlayersInRoom: string[]
}
