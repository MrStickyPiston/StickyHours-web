// Warning: only used fields are implemented
export interface ZermeloUser {
    code: string

    firstName: string,
    prefix: string,
    lastName: string,

    isStudent: boolean,
    isTeacher: boolean,

    schoolInSchoolYears: [Number]
}
