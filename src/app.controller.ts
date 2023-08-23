import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ParseBoolPipe } from './parse-bool.pipe';
import { hungarianZips } from './util/hungarianZips';
import { agglomerationZips } from './util/budapest.agglomeration';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/zip/:zipNumber/:quantity/:needsLoading/:carType')
  async calculatePrice(
    @Param('zipNumber', ParseIntPipe) zipNumber: number,
    @Param('quantity', ParseIntPipe) quantity: number,
    @Param('needsLoading', ParseBoolPipe) needsLoading: boolean,
    @Param('carType') carType: string,
    @Res() res: Response,
  ): Promise<Response> {
    // check if zip is valid, if not, throw 404
    // TODO: if we know the params, let's add more error handling!
    if (!hungarianZips.includes(zipNumber)) {
      throw new NotFoundException(
        'The zipnumber you provided is not a valid Hungarian ZIP code.',
      );
    }

    const palletPrice = await this.appService.getPalletPrice(
      quantity,
      needsLoading,
    );

    // if the transfer is to Budapest or nearby, use fixed prices
    const transferIsToBudapest =
      zipNumber.toString().startsWith('1') ||
      agglomerationZips.includes(zipNumber);
    if (transferIsToBudapest) {
      const budapestTransferData =
        await this.appService.getTransferDataToBudapest(
          quantity,
          carType,
          palletPrice,
        );
      const data = `
        <p>Looks like we are going to Budapest with fixed prices.</p>
        <p>Quantity: ${budapestTransferData.quantity}</p>
        <p>Transfer price: ${budapestTransferData.transfer}</p>
        <p>Pallet price: ${budapestTransferData.palletPrice}</p>
        <p>Total: ${budapestTransferData.totalPrice}</p>
        `;
      const response = await this.appService.getHtml(data);
      return res.type('text/html').send(response);
    }

    const distanceKms = await this.appService.calculateDistance(zipNumber);

    const basePricePerKm = 350;
    const loadingPricePerKm = await this.appService.getLoadingPricePerKm(
      quantity,
      needsLoading,
    );

    const totalPricePerKm = basePricePerKm + loadingPricePerKm;
    const transferPrice = totalPricePerKm * distanceKms;

    const totalPrice = palletPrice + transferPrice;

    const dynamicData = `<p>Distance in kilometers: ${distanceKms}</p>
    <p>Base price per kilometer: ${basePricePerKm}</p>
    <p>Loading price per kilometer: ${loadingPricePerKm}</p>
    <p>Total price per kilometer: ${totalPricePerKm}</p>
    <p>Transfer price: ${transferPrice}</p>
    <p>Pallet price: ${palletPrice}</p>
    <p>Total price: ${totalPrice}</p>`;

    const response = await this.appService.getHtml(dynamicData);
    return res.type('text/html').send(response);
  }
}
