import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom, of } from 'rxjs';
import { UtilsService } from '../utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ZermeloService {

  instance!: string;
  loggedIn: boolean = false;

  constructor(
    private http: HttpClient,
    private utils: UtilsService
  ) { }

  private getApiUrl(instance: string, endpoint: string) {
    return `https://${instance}.zportal.nl/api/v3/${endpoint}`
  }

  getDashboardUrl(instance: string) {
    return `https://${instance}.zportal.nl/`
  }

  async isValid(instance: string) {

    const pattern: RegExp = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

    if (!pattern.test(instance)) {
        return false
    }


    // This will return 200 OK on an existing instance id, and 404 on any other instance id
    let url = this.getApiUrl(instance, 'oauth/logout?access_token=null')

    try {

      return(await lastValueFrom(this.http.get(url, { observe: 'response', responseType: 'text' }))).ok

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status == 404) {
          return false
        }
        
        this.utils.error(e, "instance id check http request", true)

      } else if (e instanceof Error){

        this.utils.error(e, "instance id check", true)

      }

      return false;
    }
  }

  async tokenLogin(token: string, instance: string) {
    
    if (!this.isValid(instance)){
      this.utils.notify("Invalid instance id", "Login failed")
      return false;
    }

    if (!(await this.checkToken(token, instance))) {
      return false
    }

    this.setToken(instance, token)
    this.instance = instance;

    this.loggedIn = true

    return true
  }

  async checkToken(token: string, instance: string, minSecondsLeft: number = 60 * 60): Promise<boolean> {
    // Check if a token is valid

    if (!this.isValid(instance)){
      this.utils.notify("Invalid instance id", "Login failed")
      return false;
    }

    try {
      const url = this.getApiUrl(instance, `tokens/~current?access_token=${token}`);

      return (await lastValueFrom(this.http.get(url, {observe: 'response'}))).ok

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status === 401) {
          console.error(`Invalid token: ${token} for instance ${instance}`)
          return false
        } 

      }
      
      if (e instanceof Error){

        this.utils.error(e, "token check", true)
      }
      
      return false;
    }
  }

  private setToken(instance: string, token: string){
    localStorage.setItem(`token-${instance}`, token)
  }

  private getToken(instance: string){
    return localStorage.getItem(`token-${instance}`)
  }
}
