import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HttpClientModule, HTTP_INTERCEPTORS} from "@angular/common/http";
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ChatComponent} from './components/chat/chat.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LoginComponent} from './components/login/login.component';
import {CreateOrJoinRoomComponent} from './components/create-or-join-room/create-or-join-room.component';
import {RoomComponent} from './components/room/room.component';

@NgModule({
    declarations: [
        AppComponent,
        ChatComponent,
        LoginComponent,
        CreateOrJoinRoomComponent,
        RoomComponent,
    ],
    imports: [
        HttpClientModule,
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
