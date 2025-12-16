import { Appointment } from "./appointment";

export class Day_Cl {
    // 1. Propiedades Privadas
    private _dayNumber: number | string; // Permitir number o string (según su uso en el constructor)
    private _monthNumber: number;
    private _yearNumber: number;
    private _dayOfWeek: number;
    private _dayString: string;
    private _monthString: string;
    private _yearString: string;
    private _isToday: boolean;
    private _isWeekend: boolean;
    private _startDay: number = 8; // Default value
    private _endDay: number = 16;   // Default value
    private _appointments: Array<any>;

    // 2. Constructor
    constructor(
        dayNumber?: number,
        monthNumber?: number,
        yearNumber?: number,
        dayOfWeek?: number,
        dayString?: string,
        monthString?: string,
        yearString?: string,
        isToday?: boolean,
        isWeekend?: boolean,
        appointments?: Array<Appointment>
    ) {
        // Inicialización de propiedades privadas. Usando '0' o ''/[] como valores por defecto.
        this._dayNumber = dayNumber ?? 0; // Usamos 0 si es number, o se puede tipar a string/number
        this._monthNumber = monthNumber ?? 0;
        this._yearNumber = yearNumber ?? 0;
        this._dayOfWeek = dayOfWeek ?? 0;

        this._dayString = dayString ?? '';
        this._monthString = monthString ?? '';
        this._yearString = yearString ?? '';

        this._isToday = isToday ?? false;
        this._isWeekend = isWeekend ?? false;

        this._appointments = appointments ?? [];
    }

    // 3. Getters
    get dayNumber(): number | string { return this._dayNumber; }
    get monthNumber(): number { return this._monthNumber; }
    get yearNumber(): number { return this._yearNumber; }
    get dayOfWeek(): number { return this._dayOfWeek; }
    get dayString(): string { return this._dayString; }
    get monthString(): string { return this._monthString; }
    get yearString(): string { return this._yearString; }
    get isToday(): boolean { return this._isToday; }
    get isWeekend(): boolean { return this._isWeekend; }
    get startDay(): number { return this._startDay; }
    get endDay(): number { return this._endDay; }
    get appointments(): Array<string> { return this._appointments; }

    // 4. Setters 
    set dayNumber(value: number | string) { this._dayNumber = value; }
    set isToday(value: boolean) { this._isToday = value; }
    set isWeekend(value: boolean) { this._isWeekend = value; }
    set appointments(value: Array<string>) { this._appointments = value; }
    set startDay(value: number) { this._startDay = value; }
    set endDay(value: number) { this._endDay = value; }
}

export class Month_Cl {
    // variables of control
    monthNumber!: number;
    yearNumber!: number;
    totalDaysOfMonth!: number; // size of current month
    startOfMonth!: number;
    daysInMonthArray!: Array<String>; // F.E. - - - 1 2 3

    monthString!: string;
    yearString!: string;

    // Array of days
    daysInMonth!: Array<Day_Cl>;

}
