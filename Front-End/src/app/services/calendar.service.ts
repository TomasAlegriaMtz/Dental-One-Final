import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable, tap, map } from 'rxjs';       

import {
    getDaysInMonth,
    getDay,
    startOfMonth,
    format, 
    startOfWeek,
    endOfWeek,
    isSameDay,
    isWithinInterval,
    endOfMonth,
} from 'date-fns';

import { Day_Cl, Month_Cl } from '../models/calendar';
import { Appointment } from '../models/appointment';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    
    // --- URLs del API ---
    private userUrl = 'https://dental-one-final.onrender.com/api/user/appointment';
    private adminUrl = 'https://dental-one-final.onrender.com/api/admin/appointments';

    // Valores estáticos para Calendar
    public DAYS_OF_WEEK: Array<string> = [
        'D', 'L', 'M', 'M', 'J', 'V', 'S'
    ];

    public FULL_DAYS_OF_WEEK: Array<string> = [
        'Domingo', 'Lunes', 'Martes', 'Miercoles',
        'Jueves', 'Viernes', 'Sabado'
    ];

    public MONTHS_OF_YEAR: Array<string> = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    public TOTAL_DAYS_OF_MONTH!: number;

    // Valores del día actual
    private currentDay!: number;
    private currentMonth!: number;
    private currentYear!: number;

    // Valores seleccionados
    selectedDay!: number;
    selectedMonth!: number;
    selectedYear!: number;
    startDayOfPeriodSelected!: number;
    endDayOfPeriodSelected!: number;

    // Array de citas en memoria
    public appointmentsUser: Array<Appointment> = []; 


    constructor(
        private http: HttpClient 
    ) {
        const date = new Date();

        this.currentDay = date.getDate();
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();

        this.selectedDay = this.currentDay;
        this.selectedMonth = this.currentMonth;
        this.selectedYear = this.currentYear;
    }

    /**
     * MÉTODO CLAVE CORREGIDO:
     * Reconstruye la fecha usando los componentes UTC para evitar que 
     * la zona horaria reste horas y cambie el día.
     */
    fetchAppointments(isAdmin: boolean): Observable<Appointment[]> {
        const url = isAdmin ? this.adminUrl : this.userUrl;
        
        return this.http.get<any[]>(url).pipe(
            map(data => {
                return data.map(appt => {
                    // 1. Creamos fecha base con lo que viene de Mongo
                    const rawDate = new Date(appt.dateTime);
                    
                    // 2. Extraemos componentes UTC (Universales)
                    // Esto evita el problema del "Día anterior a las 6pm"
                    const year = rawDate.getUTCFullYear();
                    const month = rawDate.getUTCMonth();
                    const day = rawDate.getUTCDate();
                    
                    let hours = rawDate.getUTCHours();
                    let minutes = rawDate.getUTCMinutes();

                    // 3. Si tenemos la hora explicita en string (ej: "10:30"), la usamos como prioridad
                    if (appt.hour && typeof appt.hour === 'string') {
                        const parts = appt.hour.split(':');
                        if (parts.length === 2) {
                            hours = parseInt(parts[0], 10);
                            minutes = parseInt(parts[1], 10);
                        }
                    }

                    // 4. Construimos la fecha LOCAL con los datos correctos
                    // new Date(año, mes, dia, hora, min) crea la fecha en TU zona horaria
                    // pero con los números correctos.
                    const correctedDate = new Date(year, month, day, hours, minutes);

                    return {
                        ...appt,
                        dateTime: correctedDate
                    };
                });
            }),
            tap(data => {
                this.appointmentsUser = data;
            })
        );
    }


    // --- GETTERS ESTATICOS ---
    getDaysOfWeek(): Array<string> {
        return this.DAYS_OF_WEEK;
    }

    getFullDaysOfWeek(): Array<string> {
        return this.FULL_DAYS_OF_WEEK;
    }

    getMonthsOfYear(): Array<string> {
        return this.MONTHS_OF_YEAR;
    }

    getTotalDaysOfMonth(): number {
        return this.TOTAL_DAYS_OF_MONTH;
    }

    getCurrentDayNumber(): number {
        return this.currentDay;
    }

    getCurrentMonthNumber(): number {
        return this.currentMonth;
    }

    getCurrentYearNumber(): number {
        return this.currentYear;
    }


    // Método para crear la estructura del mes
    getNewMonth(month: number, year: number): Month_Cl {

        let newMonth = new Month_Cl();
        const baseDate = new Date(year, month, 1);

        newMonth.daysInMonth = [];
        newMonth.startOfMonth = getDay(baseDate);
        newMonth.totalDaysOfMonth = getDaysInMonth(baseDate);
        newMonth.monthNumber = month;
        newMonth.yearNumber = year;

        newMonth.monthString = this.MONTHS_OF_YEAR[baseDate.getMonth()];
        newMonth.yearString = format(baseDate, 'yyyy');

        // Rellenar días vacíos al inicio
        for (let i = 0; i < newMonth.startOfMonth; i++) {
            newMonth.daysInMonth.push(new Day_Cl());
        }

        // Insertar días reales
        for (let i = 1; i <= newMonth.totalDaysOfMonth; i++) {

            const dtDaily = new Date(year, month, i);

            const isCurrentDay = (this.currentDay === i && this.currentMonth === month && this.currentYear === year);
            const dayOfWeekNumber = getDay(dtDaily); 
            const isWeekend = (dayOfWeekNumber === 0 || dayOfWeekNumber === 6); 
            
            let app: Array<Appointment> = []; 

            // Filtramos las citas para este día específico
            if (this.appointmentsUser && this.appointmentsUser.length > 0) {
                // isSameDay compara año, mes y día. Como ya corregimos dateTime arriba,
                // ahora coincidirá correctamente.
                app = this.appointmentsUser.filter(a => isSameDay(a.dateTime, dtDaily));
            }

            let day = new Day_Cl(
                i,
                month,
                year,
                dayOfWeekNumber,
                format(dtDaily, 'dd'),
                this.MONTHS_OF_YEAR[baseDate.getMonth()],
                format(dtDaily, 'yyyy'),
                isCurrentDay,
                isWeekend,
                app
            );

            newMonth.daysInMonth.push(day);
        }

        // Rellenar final del calendario
        const remainingSlots = 42 - newMonth.daysInMonth.length; 
        for (let i = 0; i < remainingSlots; i++) {
            newMonth.daysInMonth.push(new Day_Cl());
        }

        return newMonth;
    }


    // Método para obtener inicio y fin de semana
    getWeek(day: Day_Cl): any {
        if(!day.dayNumber) return { startDay: '01', endDay: '01'};

        const date = new Date(day.yearNumber, day.monthNumber, Number(day.dayNumber));

        const startPeriodDate = startOfWeek(date);
        const endPeriodDate = endOfWeek(date);

        let startDay = format(startPeriodDate, 'dd');
        let endDay = format(endPeriodDate, 'dd');

        // Ajuste cuando la semana cruza entre meses
        if (Number(startDay) >= Number(endDay)) {
            if (date.getMonth() != startPeriodDate.getMonth()) {
                startDay = format(startOfMonth(endPeriodDate), 'dd');
            } else {
                endDay = format(endOfMonth(startPeriodDate), 'dd');
            }
        }

        this.selectedDay = Number(day.dayNumber);
        this.startDayOfPeriodSelected = Number(startDay);
        this.endDayOfPeriodSelected = Number(endDay);

        return { startDay, endDay };
    }


    // Filtrar citas para el periodo seleccionado
    getApptBetweenPeriod(): Array<Appointment> {
        if (!this.appointmentsUser || this.appointmentsUser.length === 0) return [];

        let appSel: Array<Appointment> = [];

        const startDate = new Date(this.selectedYear, this.selectedMonth, this.startDayOfPeriodSelected);
        
        // Ajustamos el endDate para que cubra todo el último día (23:59:59)
        const endDate = new Date(this.selectedYear, this.selectedMonth, this.endDayOfPeriodSelected);
        endDate.setHours(23, 59, 59); 

        const interval = { start: startDate, end: endDate };
        
        appSel = this.appointmentsUser
            .filter(appointment => isWithinInterval(appointment.dateTime, interval))
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        return appSel;
    }

}