import { Component, OnInit } from '@angular/core';
import { User } from '../../models/user';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-paciente',
  imports: [CommonModule],
  templateUrl: './paciente.html',
  styleUrl: './paciente.css',
})

export class Paciente implements OnInit {
  userName?: string;
  userEmail?: string;
  //any para acceder a sus propiedades
  user?: any;

  constructor(private router: Router){

  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData(): void {
    const userData = localStorage.getItem('infLog');
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        
        // Accedemos al objeto userLogged
        this.user = userInfo.userLogged;

        // Asignamos las propiedades específicas usando los nombres exactos del JSON
        // Nota: En tu JSON los campos empiezan con guion bajo (_name, _email)
        this.userName = this.user._name;
        this.userEmail = this.user._email;
      } catch (error) {
        console.error('Error al parsear JSON de localStorage', error);
      }
    } else {
      this.userName = "Nombre";
      this.userEmail = "email";
      console.warn('No se encontró infLog en localStorage');
    }
  }

  navigate(): void{
    this.router.navigate(['/formulario']);
  }
}
