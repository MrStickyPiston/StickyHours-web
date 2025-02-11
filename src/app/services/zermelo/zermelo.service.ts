import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { UtilsService } from '../utils/utils.service';
import { SchoolFunctionSettings } from '../../types/school-function-settings';
import { Teacher } from '../../types/users/teacher';
import { Student } from '../../types/users/student';
import { User } from '../../types/users/user';
import { ZermeloUser } from '../../types/zermelo-user';
import { Appointment } from '../../types/appointment/appointment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ZermeloService {
  // Basic functions and utility used for logging in, managing tokens and managing instances

  constructor(
    private http: HttpClient,
    private router: Router,
    private utils: UtilsService
  ) { }

  // Urls
  private getApiUrl(instance: string, endpoint: string) {
    return `https://${instance}.zportal.nl/api/v3/${endpoint}`
  }

  getDashboardUrl(instance: string) {
    return `https://${instance}.zportal.nl/`
  }

  // Account management
  async codeLogin(code: string, instance: string, remember_token: boolean) {

    const data = new HttpParams().appendAll(
      {
        code: code,
        grant_type: 'authorization_code',
        rememberMe: remember_token,
      }
    );

    const url = this.getApiUrl(instance, 'oauth/token');

    try {
      let json = (await lastValueFrom(this.http.post(url, data, { observe: 'response', responseType: 'json', headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') }))).body as { access_token: string }

      return this.tokenLogin(json.access_token, instance)

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status === 404) {
          console.error(`Instance ${instance} does not exist.`);
          return false

        } else if (e.status === 400) {
          // Workaround zermelo bug returning Body: b'{"response":{"status":400,"message":"The request was syntactically incorrect. Did you provide valid JSON?"}}'
          // when the linkcode is expired

          return false;
        } else {
          this.utils.error(e, "code login", true)
        }
      } else {
        this.utils.notify('Could not reach the zermelo servers');
        return false
      }

      this.utils.error(e as Error, "code login", true)
      return false
    }
  }

  async tokenLogin(token: string, instance: string) {

    if (!(await this.checkToken(token, instance))) {
      return false
    }

    this.setToken(instance, token)

    return true
  }

  async checkToken(token: string | null, instance: string): Promise<boolean> {
    // Check if a token is valid

    if (token == null) {
      return false
    }

    const url = this.getApiUrl(instance, `tokens/~current?access_token=${token}`);

    try {

      return (await lastValueFrom(this.http.get(url, { observe: 'response' }))).ok

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status == 404) {
          console.error(`Invalid instance: ${instance} while checking instance`)
          return false
        }

        if (e.status == 401) {
          console.error(`Invalid token: ${token} for instance ${instance}`)
          return false
        }

      }

      if (e instanceof Error) {

        this.utils.error(e, "token check", true)
      }

      return false;
    }
  }

  async isLoggedIn(instance: string) {
    return await this.checkToken(this.getToken(instance), instance)
  }

  async logout(instance: string) {
    console.log(`Logging out ${instance}`)
    this.clearToken(instance)
    this.router.navigate([instance, 'login'])
    // TODO: log out
  }

  // Instances
  async isValidInstance(instance: string) {

    const pattern: RegExp = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

    if (!pattern.test(instance)) {
      return false
    }


    // This will return 200 OK on an existing instance id, and 404 on any other instance id
    let url = this.getApiUrl(instance, 'oauth/logout?access_token=null')

    try {

      return (await lastValueFrom(this.http.get(url, { observe: 'response', responseType: 'text' }))).ok

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status == 404) {
          return false
        }

        this.utils.error(e, "instance id check http request", true)

      } else if (e instanceof Error) {

        this.utils.error(e, "instance id check", true)

      }

      return false;
    }
  }

  getInstances(): Set<string> {
    return new Set(JSON.parse(localStorage.getItem('instances')!));
  }

  addInstance(instance: string) {
    let instances = this.getInstances()
    instances.add(instance)

    localStorage.setItem(
      'instances',
      JSON.stringify(Array.from(instances))
    )
  }

  clearInstance(instance: string) {
    let instances = this.getInstances()
    instances.delete(instance)

    localStorage.setItem(
      'instances',
      JSON.stringify(Array.from(instances))
    )
  }

  setLastInstance(instance: string){
    localStorage.setItem('lastInstance', instance)
  }

  getLastInstance(){
    return localStorage.getItem('lastInstance')
  }

  // Tokens
  clearToken(instance: string) {
    localStorage.removeItem(`token_${instance}`)
  }

  private setToken(instance: string, token: string) {
    localStorage.setItem(`token_${instance}`, token)

    this.addInstance(instance)
  }

  private getToken(instance: string) {
    return localStorage.getItem(`token_${instance}`)
  }

  // Requests
  buildHttpParams(instance: string, params: Record<string, string> = {}) {
    return new HttpParams().append('access_token', this.getToken(instance)!).appendAll(params)
  }

  async sendGetRequest(instance: string, endpoint: string, params: HttpParams) {
    const url = this.getApiUrl(instance, endpoint)

    try {

      return await lastValueFrom(this.http.get(url, { observe: 'response', params: params }))

    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status == 401) {
        // session expired
        this.utils.notify("Your current session has been exipred. Please log in again", "Session expired")
        this.logout(instance)

      }
      
      throw e
    }
  }

  // Account data
  async getUser(instance: string): Promise<ZermeloUser> {
    let r = await this.sendGetRequest(
      instance,
      'users/~me',
      this.buildHttpParams(instance)
    )

    return (r?.body as { response: { data: [Object] } }).response.data[0] as ZermeloUser
  }

  async getSettings(instance: string): Promise<SchoolFunctionSettings | null> {
    function getSchoolYear() {
      const month = new Date().getMonth()

      if (month < 8) {
        return new Date().getFullYear() - 1
      } else {
        return new Date().getFullYear()
      }
    }

    const user = await this.getUser(instance)

    return ((await this.sendGetRequest(instance, 'schoolfunctionsettings', this.buildHttpParams(instance, { archived: 'false', year: getSchoolYear().toString(), schoolInSchoolYear: user.schoolInSchoolYears.map(String).join(',') })))?.body as { response: { data: [Object] } }).response.data[0] as SchoolFunctionSettings
  }

  // Utils
  async getSchedule(user: User, instance: string, weeks: number) {
    const zermeloUser = await this.getUser(instance)
    const settings = await this.getSettings(instance)

    if (zermeloUser.isStudent && !settings!.studentCanViewProjectSchedules) {
      return null
    } else if (!settings!.employeeCanViewProjectSchedules) {
      return null
    }

    let params = this.buildHttpParams(instance, {
      'fields': 'groups,start,end,startTimeSlot,endTimeSlot,teachers',
      'valid': 'true',
      'cancelled': 'false'
    })

    if (!user.isTeacher) {
      params = params.append('possibleStudents', user.code)
    } else {
      params = params.append('teachers', user.code)
    }

    // Date and time
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
    const end = new Date(start.getTime() + (6 + 7 * (weeks - 1)) * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);

    params = params.appendAll({
      'start': Math.floor(start.getTime() / 1000),
      'end': Math.floor(end.getTime() / 1000)
    })

    try {
      return ((await this.sendGetRequest(instance, 'appointments', params))?.body as { response: { data: [Appointment] } }).response.data as Appointment[]
    } catch (err) {
      const e = err as HttpErrorResponse

      if (e.status == 403) {
        this.utils.notify("Zermelo rejected the request. Please try again with less weeks and check if your schedule exists in the zermelo portal.", "Could not fetch schedule")
        return null
      }

      throw err
    }
  }

  async getUsers(instance: string) {

    const user = await this.getUser(instance)
    const settings = await this.getSettings(instance)

    if (user.isStudent && !settings!.studentCanViewProjectSchedules) {
      return null
    } else if (!settings!.employeeCanViewProjectSchedules || !settings!.employeeCanViewProjectSchedules) {
      return null
    }

    let student_params: HttpParams

    const useStudentNames = (!user.isStudent && settings?.employeeCanViewOwnSchedule) || settings?.studentCanViewProjectNames

    if (useStudentNames) {
      student_params = this.buildHttpParams(instance, {
        'schoolInSchoolYear': settings?.schoolInSchoolYear!,
        'isStudent': 'true',
        'fields': 'firstName,prefix,lastName,code'
      })
    } else {
      student_params = this.buildHttpParams(instance, {
        'schoolInSchoolYear': settings?.schoolInSchoolYear!,
        'isStudent': 'true',
        'fields': 'code'
      })
    }

    const teacher_params = this.buildHttpParams(instance, {
      'schoolInSchoolYear': settings?.schoolInSchoolYear!,
      'isEmployee': 'true',
      'fields': 'prefix,lastName,code'
    })

    let users_students: User[] = []
    let users_teachers: User[] = []
    let students: Student[]
    let teachers: Teacher[]

    students = ((await this.sendGetRequest(instance, 'users', student_params))?.body as { response: { data: [Student] } }).response.data
    teachers = ((await this.sendGetRequest(instance, 'users', teacher_params))?.body as { response: { data: [Teacher] } }).response.data

    teachers.forEach((teacher: Teacher) => {
      users_teachers.push(
        {
          name: teacher.prefix ? `${teacher.prefix} ${teacher.lastName} (${teacher.code})` : `${teacher.lastName} (${teacher.code})`,
          code: teacher.code,
          isTeacher: true
        }
      )
    });

    students.forEach((student: Student) => {
      if (useStudentNames) {
        users_students.push(
          {
            name: student.prefix ? `${student.firstName} ${student.prefix} ${student.lastName} (${student.code})` : `${student.firstName} ${student.lastName} (${student.code})`,
            code: student.code,
            isTeacher: false
          }
        )
      } else {
        users_students.push(
          {
            name: student.code,
            code: student.code,
            isTeacher: false
          }
        )
      }
    });

    let users: User[] = [...users_teachers.sort((a, b) => a.name.localeCompare(b.name)), ...users_students.sort((a, b) => a.name.localeCompare(b.name))]

    return users
  }
}
