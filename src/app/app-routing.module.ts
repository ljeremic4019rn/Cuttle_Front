import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from "./components/login/login.component";
import {CreateOrJoinRoomComponent} from "./components/create-or-join-room/create-or-join-room.component";
import {RoomComponent} from "./components/play-area/room/room.component";

const routes: Routes = [
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'setUpRoom',
        component: CreateOrJoinRoomComponent
    },
    {
        path: 'room/:key',
        component: RoomComponent
    }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
