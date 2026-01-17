import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';
import { UserService } from '../../services/user.service';
//google sign in
declare const google: any;
import { HttpClient } from '@angular/common/http';
import { AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-log-in',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.css'
})
export class LogIn implements AfterViewInit{
  emailPressed: boolean = true;

  loginForm!: FormGroup;
  loginFormPhone!: FormGroup;
  //para el google sign in
  private backendUrl = 'https://dental-one-final.onrender.com/api/login';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Create reactive form
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.loginFormPhone = this.formBuilder.group({
      phone: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

  }

  // Function to change mode to log in
  changeMode(): void {
    this.emailPressed = !this.emailPressed;
  }


  // Method to login with username and password or phone and password
  logIn(): void {
    const formActivo = this.emailPressed ? this.loginForm : this.loginFormPhone;

    if (formActivo.invalid) {
      Swal.fire('Atención', 'Por favor llena todos los campos', 'warning');
      return;
    }

    LoaderService.show();

    const username = this.emailPressed ?
      this.loginForm.get('username')!!.value :
      this.loginFormPhone.get('phone')!!.value;

    const password = this.emailPressed ?
      this.loginForm.get('password')!!.value :
      this.loginFormPhone.get('password')!!.value;

    this.userService.login(username, password, this.emailPressed)
      .subscribe({
        next: (isSuccessful) => {
          Swal.fire({
          title: '¡Bienvenido!',
          text: 'Inicio de sesión correcto',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
           this.router.navigate(['/']); 
        });
        },
        error: () => {
          Swal.fire('Error', `Sucedio algun error`, `error`);

        },
        complete: () => {
          LoaderService.close();
        }

      });
  }

  // Función de callback que Google llamará al iniciar sesión
  handleCredentialResponse = (response: any) => {
    // 1. Recibimos el token JWT de Google 
    const idToken = response.credential;
    console.log("Token JWT recibido en el front", idToken);
    
    // 2. Enviamos el token a tu backend para verificación y login
    this.http.post(this.backendUrl, { token: idToken }).subscribe({
      next: (res: any) => {
        if(res && res.token){
          localStorage.setItem('auth_token', res.token);
          this.userService.register(res.user);
          
        }
        Swal.fire({
          title: "¡Todo listo!",
          text: "Tu historia clínica ha sido guardada. Bienvenido.",
          icon: "success",
          confirmButtonText: 'Ir al Inicio'
        }).then((result) => {
          // Navegamos SOLO cuando el usuario cierra la alerta
          this.router.navigate(['/']); 
        });
      },
      // en caso de error
      error: (err) => {
        console.error('Error al enviar el token al backend', err);
      }
    });
  }
  ngAfterViewInit(): void {
    // Check if the Google object is available
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: "305375866482-j66uhnuh0t4hjk67bb7dd2js5glqn6hg.apps.googleusercontent.com",
        context: "signin",
        // añadimos el callback, asegurando el contexto (this)
        callback: this.handleCredentialResponse.bind(this),
        login_uri: "https://dental-one-final.onrender.com/api/login",
        auto_select: true,
        itp_support: true
      });

      google.accounts.id.renderButton(
        document.getElementById("google-button-container"),
        { // Button configuration
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "signin_with",
          size: "large",
          logo_alignment: "left",
        }
      );
    }
  }
}