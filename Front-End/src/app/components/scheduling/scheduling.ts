import { Component, effect, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { HttpClient } from '@angular/common/http';

import Swal from 'sweetalert2';
import { ScheduleService } from '../../services/schedule.service';

interface TreatmentOption {
  reason: string;
  duration: number;
  assignDoctor: string;
  price: number;
}

@Component({
  selector: 'app-scheduling',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './scheduling.html',
  styleUrl: './scheduling.css'
})
export class Scheduling implements OnInit {

  // URL para guardar la cita
  private urlScheduling = 'https://dental-one-final.onrender.com/api/register/appointment';

  // Variable para almacenar las horas generadas
  availableHours: string[] = [];

  // Reactive Form Group
  schedulForm!: FormGroup;

  // Flag para controlar el renderizado (*ngIf)
  isFormReady = false;

  // Opciones de estado
  scheduleStatus = [
    { value: 'Scheduled' },
    { value: 'Confirmed' },
    { value: 'Canceled' },
    { value: 'Completed' },
  ];

  reasonSchedule: TreatmentOption[] = [
    { reason: 'Limpieza Dental y Revisión General', duration: 45, assignDoctor: 'Dra. Elena Sonrisa', price: 600 },
    { reason: 'Resina (Empaste por caries)', duration: 60, assignDoctor: 'Dr. Roberto Molar', price: 850 },
    { reason: 'Ajuste de Brackets (Ortodoncia)', duration: 20, assignDoctor: 'Dra. Sofía Frenillos', price: 500 },
    { reason: 'Extracción Simple / Muela', duration: 45, assignDoctor: 'Dr. Roberto Molar', price: 1200 },
    { reason: 'Blanqueamiento Dental', duration: 60, assignDoctor: 'Dra. Elena Sonrisa', price: 2500 },
    { reason: 'Endodoncia (Tratamiento de conducto)', duration: 90, assignDoctor: 'Dr. Carlos Raíz', price: 3800 },
    { reason: 'Valoración para Implante', duration: 30, assignDoctor: 'Dr. Javier Cirujano', price: 300 },
    { reason: 'Urgencia Dental (Dolor agudo)', duration: 30, assignDoctor: 'Dra. Elena Sonrisa', price: 500 }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private routerSchedule: Router,
    public userService: UserService,
    private http: HttpClient,
    private scheduleService: ScheduleService
  ) {
    // 1. Generamos las horas disponibles (08:00 - 16:00)
    this.generateTimeSlots();

    // 2. Effect para reaccionar cuando el usuario carga
    effect(() => {
      const user = this.userService.userLogged();

      if (user && !this.isFormReady) {
        this.initializeForm(user);
        this.isFormReady = true;
      } else if (!user && this.isFormReady) {
        this.isFormReady = false;
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.routerSchedule.navigate(['/']);
      return;
    }
  }

  // --- LÓGICA DE HORARIOS ---
  generateTimeSlots(): void {
    const startHour = 8;
    const endHour = 16;

    for (let hour = startHour; hour <= endHour; hour++) {
      const hourString = hour.toString().padStart(2, '0');
      this.availableHours.push(`${hourString}:00`);

      if (hour < endHour) {
        this.availableHours.push(`${hourString}:30`);
      }
    }
  }

  // --- INICIALIZACIÓN DEL FORMULARIO ---
  /**
   * Recibe el usuario (Instancia de clase User) y llena el formulario.
   */
  initializeForm(user: any): void {

    // A. PREPARAR DATOS DEL USUARIO
    // Usamos los getters de la clase User (.name, .lastname, .phone, .email)
    // El operador || '' evita que salga undefined en el input
    const nombreCompleto = user.name ? `${user.name} ${user.lastname || ''}`.trim() : '';
    const emailUsuario = user.email || '';
    const telefonoUsuario = user.phone || '';
    const patientId = user.idUser || user.id || '';

    // B. REVISAR SI VIENE DEL CALENDARIO (Pre-selección)
    let preSelectedHour = '';
    const citaStorage = localStorage.getItem('cita');

    if (citaStorage) {
      try {
        const citaObj = JSON.parse(citaStorage);
        if (citaObj.hour) {
          // Verificamos que la hora guardada exista en nuestro array de horas
          if (this.availableHours.includes(citaObj.hour)) {
            preSelectedHour = citaObj.hour;
          }
        }
        // Opcional: Borrar la cita del storage para que no persista siempre
        // localStorage.removeItem('cita'); 
      } catch (e) {
        console.error('Error leyendo cita del storage', e);
      }
    }

    // C. CONSTRUIR EL FORMULARIO
    this.schedulForm = this.formBuilder.group({
      dateTime: [new Date(), [Validators.required]],
      hour: [preSelectedHour, [Validators.required]], // Ponemos la hora pre-seleccionada si existe
      durationMinutes: [this.reasonSchedule[0].duration, [Validators.required, Validators.min(1)]],

      // Datos del paciente (Solo lectura o pre-llenados)
      patientName: [nombreCompleto, [Validators.required, Validators.minLength(2)]],
      patientId: [patientId, []],
      contactNumber: [telefonoUsuario, [Validators.required]],
      email: [emailUsuario, [Validators.required]],

      // Datos de la cita
      reason: [this.reasonSchedule[0].reason, [Validators.required, Validators.minLength(5)]],
      providerName: [this.reasonSchedule[0].assignDoctor, [Validators.required]],
      status: ['Scheduled', [Validators.required]],
      notes: ['', []],
    });
  }

  // --- LÓGICA DE INTERACCIÓN ---
  changeValue(event: Event): void {
    const target: HTMLSelectElement = event.target as HTMLSelectElement;
    const selected = this.reasonSchedule.find(rS => rS.reason === target.value);

    this.schedulForm.patchValue({
      durationMinutes: selected?.duration,
      reason: selected?.reason,
      providerName: selected?.assignDoctor
    });
  }


  submitSchedule(): void {

    // Validaciones básicas del formulario
    if (this.schedulForm.invalid) {
      this.schedulForm.markAllAsTouched();
      Swal.fire({
        icon: 'error',
        title: 'Formulario Incompleto',
        text: 'Por favor, completa los campos requeridos.',
      });
      return;
    }

    const formData = this.schedulForm.getRawValue();

    const selectedTreatment = this.reasonSchedule.find(
      item => item.reason === formData.reason
    );

    if (!selectedTreatment) {
      Swal.fire('Error', 'El tratamiento seleccionado no es válido', 'error');
      return;
    }

    // Confirmación visual
    Swal.fire({
      title: 'Confirmar y Pagar',
      html: `
      <div style="text-align: left; font-size: 15px; line-height: 1.6;">
        <p><strong>Tratamiento:</strong> ${selectedTreatment.reason}</p>
        <p><strong>Especialista:</strong> ${selectedTreatment.assignDoctor}</p>
        <p><strong>Duración:</strong> ${selectedTreatment.duration} min</p>
        <hr>
        <p style="font-size: 18px;"><strong>Total a pagar: $${selectedTreatment.price} MXN</strong></p>
      </div>
    `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: `Pagar $${selectedTreatment.price}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#009ee3',
    }).then((result) => {

      if (!result.isConfirmed) return;

      // Loader
      Swal.fire({
        title: 'Procesando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Crear preferencia de pago
      this.scheduleService
        .processPay(selectedTreatment.reason, selectedTreatment.price)
        .subscribe({

          next: (payRes: any) => {

            if (!payRes.init_point) {
              Swal.fire('Error', 'No se recibió el link de pago', 'error');
              return;
            }

            // Guardar cita
            this.http.post(this.urlScheduling, formData).subscribe({

              next: () => {
                Swal.fire({
                  title: "Cita Agendada",
                  text: "Tu cita ha sido registrada correctamente.",
                  icon: "success"
                });

                // Limpiar storage
                localStorage.removeItem('cita');

                //Redirigir a Mercado Pago
                window.location.href = payRes.init_point;
              },

              error: (err) => {
                console.error(err);
                Swal.fire('Error', 'No se pudo registrar la cita', 'error');
              }

            });
          },

          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo conectar con el sistema de pagos', 'error');
          }

        });
    });
  }



}