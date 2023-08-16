import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteInterface } from './route.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/zip/:zipNumber')
  async getZip(@Param() params: any): Promise<RouteInterface> {
    return this.appService.findDistanceTo(params.zipNumber);
  }

  @Get('/zip/:zipNumber/:quantity/:carType/:needsLoading')
  async calculatePrice(@Param() params: any): Promise<number> {
    const distance =
      (await this.appService.findDistanceTo(params.zipNumber)).routes[0]
        .distanceMeters + 5;
    const basePricePerKm = 350;

    // add palletprice

    // add loadingPrice

    // if zip is between certain numbers, take routing to M0

    return distance * basePricePerKm;
  }
}
