import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { RouteInterface } from './route.interface';
import { ConfigService } from '@nestjs/config';
import { priceList } from './util/budapest.prices';
import { m0Zips } from './util/budapest.agglomeration';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findDistanceTo(zipCode: number): Promise<RouteInterface> {
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
              address: `${zipCode.toString()} Magyarország`,
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
    if (quantity <= 120 && needsLoading === false) {
      return 0;
    } else {
      let nrOfPalletts;
      if (nrOfPalletts <= 55) {
        nrOfPalletts = 1;
      } else {
        nrOfPalletts = Math.ceil((quantity - 10) / 50);
      }
      return nrOfPalletts * pricePerPallet;
    }
  }

  async getLoadingPricePerKm(
    quantity: number,
    needsLoading: boolean,
  ): Promise<number> {
    if (!needsLoading && quantity <= 120) {
      console.log('no loading fee');
      return 0;
    } else {
      const loadingPerKm = quantity <= 400 ? 280 : 340;
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

  async getTransferDataToBudapest(
    quantity: number,
    carType: string,
    palletPrice: number,
  ): Promise<{
    quantity: number;
    transfer: number;
    palletPrice: number;
    totalPrice: number;
  }> {
    const budapestFee = await this.getFeeToBudapest(quantity, carType);
    const totalPrice = budapestFee + palletPrice;
    const result = {
      quantity,
      transfer: budapestFee,
      palletPrice,
      totalPrice,
    };
    return { ...result };
  }

  async calculateDistance(zipNumber: number): Promise<number> {
    if (m0Zips.hasOwnProperty(zipNumber)) {
      const distanceInKilometers = m0Zips[zipNumber];
      return distanceInKilometers;
    }

    const distanceMeters =
      (await this.findDistanceTo(zipNumber)).routes[0].distanceMeters + 5;
    const distanceKms = Math.floor(distanceMeters / 1000) * 2;
    return distanceKms;
  }

  async getHtml(data: string): Promise<string> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Grass Transfer Price Calculation</title>
      </head>
      <body>
          <h1>Let's calculate prices!</h1>
          ${data}
      </body>
      </html>
    `;
    return htmlContent;
  }
}
