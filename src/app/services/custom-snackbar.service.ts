import {Injectable} from '@angular/core';
import {MatSnackBar} from "@angular/material/snack-bar";
import {CustomSnackbarComponent} from "../components/custom-snackbar/custom-snackbar.component";

@Injectable({
    providedIn: 'root'
})
export class CustomSnackbarService {

    public toastMessage: string = ""

    constructor(private snackBar: MatSnackBar) {
    }

    showCustomSnackbar(message: string) {
        this.toastMessage = message;

        this.snackBar.openFromComponent(CustomSnackbarComponent, {
            duration: 5000,
            verticalPosition: 'top',
        });
    }

}
