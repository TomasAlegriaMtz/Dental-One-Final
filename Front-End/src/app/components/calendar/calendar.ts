import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CalendarService } from '../../services/calendar.service';
import { Day_Cl, Month_Cl } from '../../models/calendar';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/appointment';
import { format, getDay } from 'date-fns';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit {
  
  // --- VARIABLES ---
  currentMonthCal!: Month_Cl | null;
  hours!: Array<string>;
  periodSelected!: { startDay: string, endDay: string };
  currentAppointments: Array<Appointment> = [];
  appointmentsMap: Array<Array<Appointment | null>> = [];
  // ----------------

  constructor(
    public calendarService: CalendarService,
    public userService: UserService,
    private appointmentsService: AppointmentsService, 
    private routerViews: Router,
    private cdr: ChangeDetectorRef, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar sesión
    if (!this.userService.isLoggedIn()) {
      this.routerViews.navigate(['/']);
      return;
    }

    // 2. Determinar si es Admin
    // Usamos el getter isAdmin de la instancia User si existe
    const user = this.userService.userLogged();
    const isAdmin = user?.isAdmin || false;

    // 3. CARGAR CITAS DESDE EL BACKEND
    // Llamamos al método del servicio que decide si pegar a /api/admin o /api/user
    this.calendarService.fetchAppointments(isAdmin).subscribe({
      next: (data) => {
        console.log(`Citas cargadas (${isAdmin ? 'Modo Admin' : 'Modo Usuario'}):`, data.length);
        
        // 4. Una vez que tenemos los datos, inicializamos el calendario visualmente
        this.initializeCalendarData();
      },
      error: (err) => {
        console.error('Error cargando citas:', err);
        Swal.fire('Error', 'No se pudieron cargar las citas', 'error');
      }
    });
  }

  /**
   * Lógica de inicialización visual del calendario
   */
  private initializeCalendarData(): void {
    const currentMonth = this.calendarService.selectedMonth;
    const currentYear = this.calendarService.selectedYear;

    // 1. Generar mes
    this.currentMonthCal = this.calendarService.getNewMonth(currentMonth, currentYear);

    // Encontrar primer día visible
    const firstDay = this.currentMonthCal.daysInMonth.find(d => d.dayNumber !== '') || this.currentMonthCal.daysInMonth[0];

    // 2. Establecer periodo y horas (8:00 a 15:30 = 15.5)
    this.periodSelected = this.calendarService.getWeek(firstDay);
    this.sethoursArray(8, 15.5);

    // 3. Obtener citas del periodo y llenar matriz
    // getApptBetweenPeriod usa los datos que acabamos de cargar en ngOnInit
    this.currentAppointments = this.calendarService.getApptBetweenPeriod();
    this.initializeAppointmentsMap();

    this.cdr.detectChanges();
  }

  /**
   * Genera el array de horas y limpia la matriz
   */
  sethoursArray(startHour: number, finishHour: number): void {
    this.hours = [];
    this.appointmentsMap = [];

    for (let i = startHour; i <= finishHour; i += 0.5) {
      let intHours = Math.floor(i);
      let decimalPart = i - intHours;
      let mConverted = decimalPart * 60; 

      let h = (intHours < 10) ? '0' + String(intHours) : String(intHours);
      let m = (mConverted < 10) ? '0' + mConverted.toFixed(0) : mConverted.toFixed(0);

      const text = h + ':' + m;
      this.hours.push(text);

      const daysArray: Array<Appointment | null> = new Array(7).fill(null);
      this.appointmentsMap.push(daysArray);
    }
  }

  /**
   * Mapea las citas lineales a la matriz [Hora][Dia]
   */
  initializeAppointmentsMap(): void {
    if (!this.hours || !this.currentAppointments || this.appointmentsMap.length === 0) return;

    const hourIndexMap = new Map<string, number>();
    this.hours.forEach((h, index) => hourIndexMap.set(h, index));

    this.appointmentsMap = this.appointmentsMap.map(row => row.fill(null));

    this.currentAppointments.forEach(appointment => {
      // Asegurarnos que dateTime sea un objeto Date
      const date = new Date(appointment.dateTime);
      
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const formattedTime = `${hour < 10 ? '0' : ''}${hour}:${minutes < 10 ? '0' : ''}${minutes}`;

      const hourIndex = hourIndexMap.get(formattedTime);
      const dayIndex = getDay(date); // 0=Domingo ... 6=Sabado

      if (hourIndex !== undefined && dayIndex >= 0 && dayIndex < 7) {
        const slots = Math.ceil(appointment.durationMinutes / 30);

        for (let i = 0; i < slots; i++) {
          const slotIndex = hourIndex + i;

          if (slotIndex < this.appointmentsMap.length) {
            if (this.appointmentsMap[slotIndex][dayIndex] === null) {
              this.appointmentsMap[slotIndex][dayIndex] = appointment;
            } else {
               // Solapamiento visual detectado
            }
          }
        }
      }
    });
  }

  // --- LÓGICA DE NAVEGACIÓN ---

  changeMonth(next: Boolean): void {
    this.currentMonthCal = null; 

    if (next) {
      this.calendarService.selectedMonth++;
      if (this.calendarService.selectedMonth > 11) {
        this.calendarService.selectedMonth = 0;
        this.calendarService.selectedYear++;
      }
    } else {
      this.calendarService.selectedMonth--;
      if (this.calendarService.selectedMonth < 0) {
        this.calendarService.selectedMonth = 11;
        this.calendarService.selectedYear--;
      }
    }

    this.initializeCalendarData();
    this.cdr.detectChanges(); 
  }

  selectDay(day: Day_Cl): void {
    if (day.dayNumber == '') return;

    this.calendarService.selectedDay = Number(day.dayNumber);
    this.periodSelected = this.calendarService.getWeek(day);

    this.currentAppointments = this.calendarService.getApptBetweenPeriod();
    this.sethoursArray(day.startDay, day.endDay);
    this.initializeAppointmentsMap();

    this.cdr.detectChanges(); 
  }

  scheduleAppointment(hour: string, day: string, dayInWeek?: number): void {
    Swal.fire({
      title: '¿Confirmar Agendamiento?',
      html: `¿Desea confirmar la cita para el ${day} a las ${hour}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.handleScheduling(hour, day, dayInWeek);
      }
    });
  }

  handleScheduling(hour: string, day: string, dayInWeek?: number): void {
    let cita = {
      hour,
      day, 
      dayInWeek
    }
    localStorage.setItem('cita', JSON.stringify(cita))
    this.router.navigate(['/scheduling']);
    this.cdr.detectChanges();
  }


  // --- GETTERS & HELPERS ---
  
  formatTime(date: Date | string): string {
    return format(new Date(date), 'HH:mm');
  }

  formatFullDateTime(date: Date | string): string {
    return format(new Date(date), 'EEE dd/MM HH:mm');
  }

  getStatusColor(status: Appointment['status']): string {
    switch (status) {
      case 'Confirmed': return 'green';
      case 'Scheduled': return 'yellow';
      case 'Completed': return 'blue';
      case 'Canceled': return 'red';
      default: return 'gray';
    }
  }
}