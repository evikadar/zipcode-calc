import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { RouteInterface } from './route.interface';
import { ConfigService } from '@nestjs/config';
import { priceList } from './util/budapest.prices';
import { m0Zips } from './util/budapest.agglomeration';
import {
  basePricePerKm,
  pricePerPallet,
  prices,
  transferPriceFrom121To400,
  transferPriceFrom401To500,
} from './util/constants';

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

    try {
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
              throw new BadRequestException('Unable to calculate distance.');
            }),
          ),
      );
      return data;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Unable to calculate distance.');
    }
  }

  async getPalletPrice(
    quantity: number,
    needsLoading: boolean,
  ): Promise<number> {
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
      const loadingPerKm =
        quantity <= 400
          ? transferPriceFrom121To400 - basePricePerKm
          : transferPriceFrom401To500 - basePricePerKm;
      return loadingPerKm;
    }
  }

  async getFeeToBudapest(quantity: number): Promise<number> {
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
    palletPrice: number,
  ): Promise<{
    quantity: number;
    transfer: number;
    palletPrice: number;
    totalPrice: number;
  }> {
    const budapestFee = await this.getFeeToBudapest(quantity);
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

  async getProductPrice(quantity: number, grassType: number): Promise<number> {
    let rangeKey: string;
    if (quantity <= 200) {
      rangeKey = '1-200';
    } else if (quantity <= 400) {
      rangeKey = '201-400';
    } else {
      rangeKey = '400+';
    }

    const productPrices = prices[grassType];
    if (!productPrices) {
      return null;
    }

    const pricePerSquareMeter = productPrices[rangeKey];
    return pricePerSquareMeter * quantity;
  }
}
