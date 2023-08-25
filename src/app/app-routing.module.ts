import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from "./components/login/login.component";
import {CreateOrJoinRoomComponent} from "./components/create-or-join-room/create-or-join-room.component";
import {TableComponent} from "./components/play-area/table/table.component";

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
        component: TableComponent
    }

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
