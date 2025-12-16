import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Cms {
    //url de strapi
    public readonly strapiUrl = 'http://localhost:1337';
    constructor(private http: HttpClient){}

    getInicio(): Observable<any>{
      // Opción segura: Pasamos los parámetros como objeto
      return this.http.get<any>(`${this.strapiUrl}/api/inicio`, {
        params: {
          populate: '*' 
        }
      }).pipe(
        map(response => {
          return response.data;
        })
      );
    }
}
