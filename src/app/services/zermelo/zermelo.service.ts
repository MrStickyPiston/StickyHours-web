import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZermeloService {

  constructor(private http: HttpClient) { }

  private getApiUrl(instance: string, endpoint: string) {
    return `https://${instance}.zportal.nl/api/v3/${endpoint}`
  }

  async isValid(instance: string) {
    let url = this.getApiUrl(instance, 'oauth')

    try {
      return(await lastValueFrom(this.http.get(url, { observe: 'response', responseType: 'text' }))).ok
    } catch (e) {
      console.error(e)
      return false;
    }
  }
}
