import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { catchError, EMPTY, retry, timeout } from 'rxjs';

import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { environment } from '../environments/environment';

// Warm-up del backend: Render (plan gratuito) duerme el servicio tras ~15 min
// sin tráfico y tarda hasta ~1 min en despertar. Llamamos /health al arrancar
// la app para que despierte en segundo plano mientras el usuario navega.
// No bloquea el arranque ni muestra errores si falla.
// Solo en producción: en desarrollo el backend local no siempre está corriendo
// y los reintentos ensucian la consola con errores de conexión.
function warmUpBackend(): void {
  if (!environment.production) {
    return;
  }
  const http = inject(HttpClient);
  http.get(`${environment.apiUrl}/health`)
    .pipe(
      timeout(90_000),
      retry({ count: 2, delay: 5_000 }),
      catchError(() => EMPTY)
    )
    .subscribe();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([tokenInterceptor])
    ),
    provideZonelessChangeDetection(),
    provideAppInitializer(warmUpBackend),
  ]
};