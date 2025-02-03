import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom, of } from 'rxjs';
import { UtilsService } from '../utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ZermeloService {

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

    // This will return 200 OK on an existing instance id, and 404 on any other instance id
    let url = this.getApiUrl(instance, 'oauth/logout?access_token=null')

    try {

      return(await lastValueFrom(this.http.get(url, { observe: 'response', responseType: 'text' }))).ok

    } catch (e) {
      if (e instanceof HttpErrorResponse) {

        if (e.status == 404) {
          return false
        }
        
        this.utils.error(e, "instance id check http", true)

      } else if (e instanceof Error){

        this.utils.error(e, "instance id check", true)

      }

      return false;
    }
  }
}
