import { Appointment } from "./appointment";

export interface ProcessedAppointments {
    timeslots: { [date: string]: Timeslot };
    daily_appointments: { [date: string]: Appointment[] };
    days: string[];
}

export interface Timeslot {
    start: number;
    end: number;
}