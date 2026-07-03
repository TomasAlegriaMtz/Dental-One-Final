import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

export interface ContactData {
    nombre: string;
    email: string;
    celular: string;
    asunto: string;
    mensaje: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private apiUrl = `${environment.apiUrl}/api/contact`;

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    submitContactForm(data: ContactData): Observable<any> {
        const token = this.userService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.post(this.apiUrl, data, { headers });
    }
}
