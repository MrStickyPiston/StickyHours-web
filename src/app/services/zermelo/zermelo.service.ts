import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { UtilsService } from '../utils/utils.service';
import { User } from '../../types/user';
import { SchoolFunctionSettings } from '../../types/school-function-settings';

@Injectable({
  providedIn: 'root'
})
export class ZermeloService {
  // Basic functions and utility used for logging in, managing tokens and managing instances

  constructor(
    private http: HttpClient,
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

    } catch (err) {
      const e = err as HttpErrorResponse

      if (e.status == 401) {
        // session expired
        this.utils.notify("Your current session has been exipred. Please log in again", "Session expired")
        this.logout(instance)

        return null
      } else {
        throw e
      }
    }
  }

  // Account data
  async getUser(instance: string): Promise<User> {
    let r = await this.sendGetRequest(
      instance,
      'users/~me',
      this.buildHttpParams(instance)
    )

    return (r?.body as {response: {data: [Object]}}).response.data[0] as User
  }

  async getSettings(instance: string): Promise<SchoolFunctionSettings | null> {
    function getSchoolYear(){
      const month = new Date().getMonth()

      if (month < 8) {
        return new Date().getFullYear() - 1
      } else {
        return new Date().getFullYear()
      }
    }

    const user = await this.getUser(instance)

    return ((await this.sendGetRequest(instance, 'schoolfunctionsettings', this.buildHttpParams(instance, {archived: 'false', year: getSchoolYear().toString(), schoolInSchoolYear: user.schoolInSchoolYears.map(String).join(',')})))?.body as {response: {data: [Object]}}).response.data[0] as SchoolFunctionSettings
  }
}
