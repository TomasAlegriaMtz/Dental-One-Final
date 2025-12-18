import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import Swal from 'sweetalert2';
import { UserService } from '../../services/user.service';
@Component({
  selector: 'app-nav-bar',
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  wasOpenMenu: Boolean = false; // to make function menu

  constructor(
    public userService: UserService
  ) { }


  ngOnInit(): void {
  }

  // Function to evaluate if button was pressed
  toggleMenu() {
    this.wasOpenMenu = !this.wasOpenMenu;
  }

  cerrarMenu() {
    this.wasOpenMenu = false;
  }

  // Close sesion
  logOut(): void {

    Swal.fire({
      title: "Cerrar Sesión",
      text: "¿Estás seguro que quieres cerrar tu sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, Cerrar Sesión"
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.logout();
      }
    });

  }

}
