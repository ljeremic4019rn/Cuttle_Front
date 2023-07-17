import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ChatComponent} from "./components/chat/chat.component";
import {LoginComponent} from "./components/login/login.component";
import {CreateOrJoinRoomComponent} from "./components/create-or-join-room/create-or-join-room.component";

const routes: Routes = [
    {
        path: 'chat',
        component: ChatComponent
    },
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'setUpRoom',
        component: CreateOrJoinRoomComponent
    }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
