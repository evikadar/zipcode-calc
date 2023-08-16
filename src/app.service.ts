import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { RouteInterface } from './route.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findDistanceTo(zipCode: string): Promise<RouteInterface> {
    const googleRouteApiKey =
      this.configService.get<string>('GOOGLE_ROUTE_API');
    const { data } = await firstValueFrom(
      this.httpService
        .post<RouteInterface>(
          `https://routes.googleapis.com/directions/v2:computeRoutes?key=${googleRouteApiKey}&$fields=routes.distanceMeters`,
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
