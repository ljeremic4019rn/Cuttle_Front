export interface LoginResponse {
    token: string
}

export interface SignUpResponse {
    id: number
    username: string
    password: string
}

export interface JoinRoomResponse{
    playerUsername: string
    playerNumber: number
    currentPlayersInRoom: string[]
}
