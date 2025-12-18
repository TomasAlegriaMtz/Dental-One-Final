import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { AboutUs } from './components/about-us/about-us';
import { Services } from './components/services/services';
import { LogIn } from './components/log-in/log-in';
import { Register } from './components/register/register';
import { Calendar } from './components/calendar/calendar';
import { UnServicio } from './components/un-servicio/un-servicio';
import { FormularioInicial } from './components/formulario-inicial/formulario-inicial';
import { HistoClinica } from './components/histo-clinica/histo-clinica';
import { Scheduling } from './components/scheduling/scheduling';
import { ContactUs } from './components/contact-us/contact-us';
import { Help } from './components/help/help';

//Importamos el guard
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'about-us', component: AboutUs},
    {path: 'contact-us', component: ContactUs},
    {path: 'help', component: Help},
    //servicio pagina normal
    {path: 'services', component: Services},
    //servicio especifico
    {path : 'servicio/:id', component : UnServicio},
    {path: 'log-in', component: LogIn},
    {path: 'register', component: Register},
    {path: 'calendar', component: Calendar, canActivate: [authGuard]},
    {path: 'formulario', component: FormularioInicial, canActivate: [authGuard]},
    {path: 'histo', component: HistoClinica, canActivate : [authGuard]},
    {path: 'scheduling', component: Scheduling, canActivate: [authGuard]},
];
