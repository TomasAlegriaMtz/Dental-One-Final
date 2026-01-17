import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component, OnInit } from '@angular/core'; // Añadido OnInit
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms'; // Añadidos ValidatorFn, AbstractControl, ValidationErrors
import { Router, RouterLink } from "@angular/router";
import Swal from 'sweetalert2';


// Expresión regular para contraseña
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]).{8,15}$/;

// Validador personalizado para la confirmacion de contrasena
export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmpsswd = control.get('confirmpsswd');

  // Solo validar si ambos controles existen y si tienen valores diferentes
  if (password && confirmpsswd && password.value !== confirmpsswd.value) {
    // Si no coinciden, retornamos el error 'mismatch'
    return { mismatch: true };
  }

  // Si coinciden (o si algún campo está vacío/no disponible), retornamos null (válido)
  return null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {

  registerForm!: FormGroup;
  private registerUrl = 'https://dental-one-final.onrender.com/api/register'

  emailPressed: Boolean = true;
  phonePressed: Boolean = false;

  constructor(private http: HttpClient, private router: Router, private builder: FormBuilder) {}


  ngOnInit(): void {
    this.registerForm = this.builder.group({
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(passwordRegex)]],
      confirmpsswd: ['', [Validators.required, Validators.pattern(passwordRegex)]]
    }, {
      validators: passwordsMatchValidator 
    });
  }

  // Función para cambiar el modo de registro (Email/Teléfono)
  changeMode(): void {
    this.emailPressed = !this.emailPressed;
    this.phonePressed = !this.phonePressed;
  }

  // Opcional: Getter para el control de la contraseña, útil en el HTML
  get passwordControl() {
    return this.registerForm.get('password');
  }

  // Opcional: Getter para el control de confirmación, útil en el HTML
  get confirmPasswordControl() {
    return this.registerForm.get('confirmpsswd');
  }

  onSubmit(){
    //primero verificamos que el form sea valido
    if(this.registerForm.invalid){
      this.registerForm.markAllAsTouched(); //Muestra los errores al usuario
      return;
    }
    
    //en caso de ser valid, se extraen los datos
    const formData = this.registerForm.value;
    const userRegisterData = {
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      email: formData.email,
      password: formData.password
    };

    //enviamos el post al back
    this.http.post(this.registerUrl, userRegisterData).subscribe({
      next: (res: any) =>{
        console.log('Registro exitoso', res);
        //guardamos el token recibido del back en el localStorage
        // Verifica si la propiedad 'token' existe en la respuesta
        if (res && res.token) {
            localStorage.setItem('auth_token', res.token); 
            console.log('Token guardado en localStorage.');
        } else {
            console.error('El servidor no devolvió el token en la respuesta.');
        }
         Swal.fire({
          title: "Registro Exitoso",
          text: "Te has registrado",
          icon: "success"
        }).then((result) => {
          if(result.isConfirmed || result.isDismissed){
            this.router.navigate(['/formulario']);
          }
        })
      },
      error : (err) => {
        console.error('No se pudo realizar el registro', err);
        let errorMsg = "Ocurrio un error";
        Swal.fire({
          title: "Problema en el registro",
          text: errorMsg,
          icon: "error"
        })
      }

    })
  }


  
}