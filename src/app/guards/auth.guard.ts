import {Injectable} from '@angular/core';
import {Router, UrlTree} from "@angular/router";
import {Observable} from "rxjs";


@Injectable({
    providedIn: 'root'
})
export class AuthGuard {

    constructor(private router: Router) {
    }

    canActivate():
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {

        if (localStorage.getItem('token') || sessionStorage.getItem('token') !== null) {
            return true;
        } else {
            alert("You have to log in first")
            this.router.navigate(["/"])
            return false;
        }
    }


}
