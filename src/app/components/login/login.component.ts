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
    signupForm: FormGroup;
    isFormValid = false;
    allowedUsernameChars = /^[a-zA-Z0-9_]+$/;
    allowedPasswordChars = /^[a-zA-Z0-9!@#$%^&*]+$/;



    constructor(private formBuilder: FormBuilder, private router: Router, private authService: AuthService) {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
            remember: false
        });

        this.signupForm = this.formBuilder.group({
            username: [''],
            password: [''],
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
                    alert("Error while logging in")
                }
            },
            error: err => {
                alert("Bad login credentials")
            }
        })
    }

    signup(){
        //check if pass or username contain illegal character
        if (!this.isUsernameValid(this.signupForm.get('username')?.value) || !this.isPasswordValid(this.signupForm.get('password')?.value)) {
            alert("Username and/or password contain illegal characters.")
            return
        }

        this.authService.signup(this.signupForm.get('username')?.value, this.signupForm.get('password')?.value).subscribe({
            next: response => {
                if (response.body.username != null) {
                    alert("User " + response.body.username + " successfully created")
                } else {
                    alert("Bad register request")
                }
            },
            error: err => {
                alert(err.error)
            }
        })
    }

    isUsernameValid(username: string): boolean {
        return this.allowedUsernameChars.test(username);
    }

    isPasswordValid(password: string): boolean {
        return this.allowedPasswordChars.test(password);
    }

}
