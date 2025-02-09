import { Injectable } from '@angular/core';
import { Appointment } from '../../types/appointment/appointment';
import { ProcessedAppointments, Timeslot } from '../../types/appointment/processed-appointment';
import { Gap } from '../../types/appointment/gap';

@Injectable({
  providedIn: 'root'
})
export class ZapiService {

  constructor() { }

  isValidAppointment(appointment: Appointment, userId: string): boolean {
    if (!appointment.startTimeSlot || !appointment.endTimeSlot) {
      console.warn(`No start and/or end timeslot for appointment: ${JSON.stringify(appointment)}`);
      return false;
    }

    if (!appointment.groups) {
      if (!appointment.teachers.includes(userId)) {
        console.info(`No group for appointment: ${JSON.stringify(appointment)}`);
        console.warn(`User not in teachers list for this appointment, skipping hour. (subjects: ${appointment.subjects})`);
        return false;
      } else {
        console.info(`No group for this appointment but ${userId} is in teachers list: ${JSON.stringify(appointment)}`);
      }
    }

    return true;
  }


  processUserData(appointments: Appointment[], userId: string): ProcessedAppointments {
    const timeslots: { [date: string]: Timeslot } = {};
    const daily_appointments: { [date: string]: Appointment[] } = {};

    for (const appointment of appointments) {
      if (!this.isValidAppointment(appointment, userId)) {
        continue;
      }

      const date = new Date(appointment.start * 1000).toISOString().slice(0, 10);

      if (!timeslots[date]) {
        timeslots[date] = {
          start: appointment.startTimeSlot,
          end: appointment.endTimeSlot,
        };
      } else {
        timeslots[date].start = Math.min(timeslots[date].start, appointment.startTimeSlot);
        timeslots[date].end = Math.max(timeslots[date].end, appointment.endTimeSlot);
      }

      if (!daily_appointments[date]) {
        daily_appointments[date] = [];
      }

      daily_appointments[date].push(appointment);
    }

    return {
      timeslots,
      daily_appointments,
      days: Object.keys(timeslots),
    };
  }


  getCommonGaps(data: ProcessedAppointments[], stickyHours: number = 0): { [date: string]: Gap[] } {
    const commonDates: Set<string> = new Set(
      data.reduce((acc, userData) => [...acc, ...userData.days], [] as string[])
    );
    const sortedCommonDates: string[] = [...commonDates].sort();

    const mergedDays: { [date: string]: { [slot: number]: { start: number; end: number } } } = {};

    // Merge data into dates
    for (const date of sortedCommonDates) {
      console.info(`Processing date: ${date}`);

      mergedDays[date] = {};

      for (const userData of data) {
        const day = userData.daily_appointments[date] || [];

        for (const appointment of day) {
          for (let i = appointment.startTimeSlot; i <= appointment.endTimeSlot; i++) {
            if (!mergedDays[date][i]) {
              mergedDays[date][i] = {
                start: appointment.start,
                end: appointment.end,
              };
            } else {
              mergedDays[date][i].start = Math.min(mergedDays[date][i].start, appointment.start);
              mergedDays[date][i].end = Math.max(mergedDays[date][i].end, appointment.end);
            }
          }
        }
      }
    }

    const minimumDaySlots: { [date: string]: { start: number; end: number } } = {};

    for (const date of sortedCommonDates) {
      for (const userData of data) {
        const slot = userData.timeslots[date];

        if (!minimumDaySlots[date]) {
          minimumDaySlots[date] = slot;
        } else {
          minimumDaySlots[date].start = Math.max(minimumDaySlots[date].start, slot.start);
          minimumDaySlots[date].end = Math.min(minimumDaySlots[date].end, slot.end);
        }
      }
    }

    const gaps: { [date: string]: Gap[] } = {};
    for (const date of sortedCommonDates) {
      console.info(`Processing common gaps: ${date}`);
      let previousSlotNumber: number | null = null;
      for (const slotNumber of Object.keys(mergedDays[date]).map(Number).sort((a, b) => a - b)) {
        if (previousSlotNumber === null) {
          previousSlotNumber = slotNumber;
          continue;
        }

        if (slotNumber - previousSlotNumber > 1) {
          const startSlot = previousSlotNumber + 1;
          const endSlot = slotNumber - 1;

          console.info(`Gap found at slot ${startSlot} - ${endSlot}`);

          // Make sure the gap is not outside the minimum day slots
          if (startSlot < minimumDaySlots[date].start - stickyHours) {
            console.info(`Gap start ${startSlot} is lower than minimum ${minimumDaySlots[date].start - stickyHours} on date ${date}`);
            continue;
          }
          if (startSlot > minimumDaySlots[date].end + stickyHours) {
            console.info(`Gap start ${startSlot} is higher than maximum ${minimumDaySlots[date].end + stickyHours} on date ${date}`);
            continue;
          }

          if (endSlot < minimumDaySlots[date].start - stickyHours) {
            console.info(`Gap end ${endSlot} is lower than minimum ${minimumDaySlots[date].start - stickyHours} on date ${date}`);
            continue;
          }
          if (endSlot > minimumDaySlots[date].end + stickyHours) {
            console.info(`Gap end ${endSlot} is higher than maximum ${minimumDaySlots[date].end + stickyHours} on date ${date}`);
            continue;
          }

          if (!gaps[date]) {
            gaps[date] = [];
          }

          gaps[date].push({
            start_slot: startSlot,
            end_slot: endSlot,
            start_time: mergedDays[date][previousSlotNumber].end,
            end_time: mergedDays[date][slotNumber].start,
          });
        }

        previousSlotNumber = slotNumber;
      }
    }

    return gaps;
  }
}
