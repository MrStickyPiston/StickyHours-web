export interface Schedule {
    start: number,
    end: number,
    
    startTimeSlot: number,
    endTimeSlot: number,

    groups: [string],
    teachers: [string]
}
