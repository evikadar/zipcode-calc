import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { RouteInterface } from './route.interface';
import { ConfigService } from '@nestjs/config';
import { priceList } from './budapest.prices';

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

  async getPalletPrice(
    quantity: number,
    needsLoading: boolean,
  ): Promise<number> {
    const pricePerPallet = 3300;
    const tax = 1.27;
    if (quantity <= 120 && needsLoading === false) {
      return 0;
    } else {
      let nrOfPalletts;
      if (nrOfPalletts <= 55) {
        nrOfPalletts = 1;
      } else {
        nrOfPalletts = Math.ceil((quantity - 10) / 50);
      }
      console.log(`For ${quantity} m2 you will need ${nrOfPalletts} pallets.`);
      return nrOfPalletts * pricePerPallet * tax;
    }
  }

  async getLoadingPricePerKm(
    quantity: number,
    needsLoading: boolean,
  ): Promise<number> {
    if (!needsLoading) {
      console.log('no loading fee');
      return 0;
    } else {
      const loadingPerKm = quantity <= 400 ? 280 : 340;
      console.log(`loading price is ${loadingPerKm}`);
      return loadingPerKm;
    }
  }

  async getFeeToBudapest(quantity: number, carType: string): Promise<number> {
    // todo: get the actual param for cartype and do error handling for everything else
    if (carType === 'darus') {
      if (quantity <= 320) {
        return 135000;
      } else if (quantity <= 350) {
        return 142500;
      } else {
        return 150000;
      }
    }

    const { upperValues } = priceList;

    let selectedUpper = 0;
    for (const upper in upperValues) {
      if (quantity <= parseInt(upper)) {
        selectedUpper = parseInt(upper);
        break;
      }
    }

    return upperValues[selectedUpper] || 0;
  }
}
