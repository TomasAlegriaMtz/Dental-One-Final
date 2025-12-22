import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    // Corregí un pequeño typo en la URL (sobraba una barra o faltaba el endpoint limpio)
    private urapi: string = 'http://localhost:3000';

    constructor(
        private http: HttpClient,
        private userService: UserService,
    ) { }

    /**
     * @param title consulta a realizar
     * @param price precio de la consulta
     */
    processPay(title: string, price: number): Observable<any> {
        if (!this.userService.isLoggedIn()) return throwError(() => new Error('User not logged in'));

        // Obtenemos el usuario logueado
        const user = this.userService.userLogged()!!;



        // Construimos el cuerpo con TODOS los datos necesarios
        const body = {
            // Datos del Producto (Item)
            title: title,
            price: price,

            // Datos del Pagador (Payer)
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            idUser: user.idUser
        }

        // Enviamos al backend
        return this.http.post(`${this.urapi}/mercado-pago/proccesPay`, body);
    }
}