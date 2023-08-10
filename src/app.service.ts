import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { RouteInterface } from './route.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly httpService: HttpService) {}

  async findDistanceTo(zipCode: string): Promise<RouteInterface> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<RouteInterface>(
          'https://routes.googleapis.com/directions/v2:computeRoutes?key=AIzaSyBO8TDRlF8lO8MJZ4M8Sm7TwdOf0DpazHM&$fields=routes.distanceMeters',
          {
            origin: {
              address: '6088 Magyarország',
            },
            destination: {
              address: `${zipCode} Magyarország`,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error);
            throw 'An error happened!';
          }),
        ),
    );
    return data;
  }
}
