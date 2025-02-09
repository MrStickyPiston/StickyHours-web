export interface Appointment {
    start: number,
    end: number,
    startTimeSlot: number;
    endTimeSlot: number;
    groups: string[];
    teachers: string[];
    subjects: string[];
}
