/**
 * HorariosSede — Value Object
 * 
 * Representa los horarios de apertura y cierre de una sede por día de la semana.
 * Permite lógicas de saber si está abierto ahora.
 */

type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export type HorarioDia = {
  apertura: string; // Formato HH:mm (ej. "06:00")
  cierre: string;   // Formato HH:mm (ej. "22:00")
  cerrado?: boolean;
};

export type HorariosMap = Partial<Record<DiaSemana, HorarioDia>>;

export class HorariosSede {
  private constructor(private readonly horarios: HorariosMap) {}

  static create(horarios: HorariosMap): HorariosSede {
    // Validaciones basicas
    for (const [dia, horario] of Object.entries(horarios)) {
      if (!horario.cerrado) {
        if (!horario.apertura?.match(/^\d{2}:\d{2}$/)) {
          throw new Error(`El horario de apertura para ${dia} tiene un formato inválido.`);
        }
        if (!horario.cierre?.match(/^\d{2}:\d{2}$/)) {
          throw new Error(`El horario de cierre para ${dia} tiene un formato inválido.`);
        }
      }
    }
    return new HorariosSede(horarios);
  }

  get raw(): HorariosMap {
    return this.horarios;
  }

  /**
   * Indica si según la hora y día actuales del sistema, la sede se encuentra abierta.
   */
  estaAbiertoAhora(): boolean {
    const ahora = new Date();
    const dias: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = dias[ahora.getDay()];
    
    const horarioHoy = this.horarios[diaActual];
    if (!horarioHoy || horarioHoy.cerrado) return false;

    const [horaApertura, minApertura] = horarioHoy.apertura.split(':').map(Number);
    const [horaCierre, minCierre] = horarioHoy.cierre.split(':').map(Number);

    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const minutosApertura = horaApertura * 60 + minApertura;
    let minutosCierre = horaCierre * 60 + minCierre;

    // Si cierra pasada la medianoche (ej. abre 08:00, cierra 02:00)
    if (minutosCierre < minutosApertura) {
      minutosCierre += 24 * 60; 
    }

    return minutosAhora >= minutosApertura && minutosAhora <= minutosCierre;
  }

  /**
   * Resumen del horario de hoy (ej. "06:00 - 22:00")
   */
  get horarioDeHoy(): string {
    const ahora = new Date();
    const dias: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaActual = dias[ahora.getDay()];
    
    const horarioHoy = this.horarios[diaActual];
    if (!horarioHoy || horarioHoy.cerrado) return "Cerrado hoy";

    return `${horarioHoy.apertura} - ${horarioHoy.cierre}`;
  }
}
