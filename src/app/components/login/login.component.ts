import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

    loginForm: FormGroup;
    isFormValid = false;


    constructor(private formBuilder: FormBuilder, private router: Router, private authService: AuthService) {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
            remember: false
        });

        this.loginForm.valueChanges.subscribe(() => {
            this.isFormValid = this.loginForm.valid;
        });

    }

    ngOnInit(): void {
    }


    login() {
        this.authService.login(this.loginForm.get('username')?.value, this.loginForm.get('password')?.value).subscribe({
            next: response => {

                if (response.body.jwt != null) {
                    sessionStorage.setItem("token", response.body.jwt)
                    sessionStorage.setItem("username", this.loginForm.get('username')?.value)

                    this.router.navigate(["setUpRoom"]);
                } else {
                    alert("Los login")
                }

            },
            error: err => {
                alert(err.error)
            }
        })
    }

    signup(){//todo
        console.log("signing up")
    }


}
