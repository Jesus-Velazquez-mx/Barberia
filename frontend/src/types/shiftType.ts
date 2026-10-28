export interface Shift {
  id: string;
  /* Nombre guardado en la BD (por ejemplo 'morning'). */
  name: string;
  /* 'HH:MM' (24 h). */
  startTime: string;
  endTime: string;
}

/* Valores del formulario de alta y edición. */
export interface ShiftFormValues {
  name: string;
  startTime: string;
  endTime: string;
}

export type ShiftPayload = ShiftFormValues;
