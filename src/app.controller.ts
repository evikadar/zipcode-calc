import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { RouteInterface } from './route.interface';
import { ParseBoolPipe } from './parse-bool.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/zip/:zipNumber')
  async getZip(@Param() params: any): Promise<RouteInterface> {
    return this.appService.findDistanceTo(params.zipNumber);
  }

  @Get('/zip/:zipNumber/:quantity/:needsLoading/:carType')
  async calculatePrice(
    @Param('zipNumber') zipNumber: string,
    @Param('quantity', ParseIntPipe) quantity: number,
    @Param('needsLoading', ParseBoolPipe) needsLoading: boolean,
    @Param('carType') carType: string,
  ): Promise<string> {
    if (zipNumber.startsWith('1')) {
      const budapestFee = await this.appService.getFeeToBudapest(
        quantity,
        carType,
      );
      return `Looks like you are going to Budapest! Price will be ${budapestFee}`;
    }

    const distanceMeters =
      (await this.appService.findDistanceTo(zipNumber)).routes[0]
        .distanceMeters + 5;
    const distanceKms = Math.floor(distanceMeters / 1000);

    const basePricePerKm = 350;

    const loadingPricePerKm = await this.appService.getLoadingPricePerKm(
      quantity,
      needsLoading,
    );

    const totalPricePerKm = basePricePerKm + loadingPricePerKm;
    const transferPrice = totalPricePerKm * distanceKms;

    const palletPrice = await this.appService.getPalletPrice(
      quantity,
      needsLoading,
    );

    const totalPrice = palletPrice + transferPrice;

    // if zip is between certain numbers, take routing to M0

    const result = `Hi Andris!\n 
    Here comes some info for you.\n
    Distance: ${distanceKms}\n
    Total price per kms (considering loading): ${totalPricePerKm}\n
    Transfer price: ${transferPrice}\n
    Pallet price: ${palletPrice}\n
    Total price (pallet + transfer): ${totalPrice}\n
    `;

    return result;
  }
}
