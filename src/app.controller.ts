import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteInterface } from './route.interface';
import { appendFile } from 'fs';

const numbersPart1 = [
  2194, 2200, 2209, 2211, 2212, 2213, 2214, 2215, 2216, 2217, 2220, 2225, 2230,
];

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/zip')
  getAllZip(): Promise<RouteInterface> {
    const numbers = [...numbersPart1];
    numbers.map(async (zipcode) => {
      const distInMeters = await this.appService.findDistanceTo(
        zipcode.toString(),
      );
      const inKms = distInMeters.routes[0].distanceMeters / 1000;
      const distance = `${zipcode} ==> ${inKms} km\n`;
      appendFile('zips.txt', distance, function (err) {
        if (err) throw err;
      });
    });

    return this.appService.findDistanceTo('1122');
  }

  @Get('/zip/:zipNumber')
  async getZip(@Param() params: any): Promise<RouteInterface> {
    return this.appService.findDistanceTo(params.zipNumber);
  }
}
