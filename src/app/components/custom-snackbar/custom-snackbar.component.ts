import {Component, Input, OnInit} from '@angular/core';
import {MatSnackBar, MatSnackBarRef} from "@angular/material/snack-bar";
import {CustomSnackbarService} from "../../services/custom-snackbar.service";


@Component({
  selector: 'app-custom-snackbar',
  templateUrl: './custom-snackbar.component.html',
  styleUrls: ['./custom-snackbar.component.css']
})
export class CustomSnackbarComponent implements OnInit {

    constructor(public customSnackbarService: CustomSnackbarService, public snackBarRef: MatSnackBarRef<CustomSnackbarComponent>) { }

  ngOnInit(): void {
  }

    closeSnackbar() {
        this.snackBarRef.dismiss();
    }

}
