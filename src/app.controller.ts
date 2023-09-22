import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ParseBoolPipe } from './parse-bool.pipe';
import { hungarianZips } from './util/hungarianZips';
import { agglomerationZips } from './util/budapest.agglomeration';
import { Response } from 'express';
import { CustomParseIntPipe } from './parse-int.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/zip/:zipNumber/:quantity/:needsLoading/:carType')
  async calculatePrice(
    @Param('zipNumber', CustomParseIntPipe) zipNumber: number,
    @Param('quantity', CustomParseIntPipe) quantity: number,
    @Param('needsLoading', ParseBoolPipe) needsLoading: boolean,
    @Param('carType') carType: 'darus' | 'emelőhátfalas',
    @Res() res: Response,
  ): Promise<Response> {
    // only accept valid ZIPs
    if (!hungarianZips.includes(zipNumber)) {
      throw new NotFoundException(
        'The zipnumber you provided is not a valid Hungarian ZIP code.',
      );
    }

    if (carType !== 'darus' && carType !== 'emelőhátfalas') {
      throw new NotFoundException(
        'Car type can be only darus or emelőhátfalas.',
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

      const data = {
        quantity: budapestTransferData.quantity,
        transfer: budapestTransferData.transfer,
        palletPrice: budapestTransferData.palletPrice,
        totalPrice: budapestTransferData.totalPrice,
      };

      return res.json(data);
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

    const jsonData = {
      distanceKms,
      basePricePerKm,
      loadingPricePerKm,
      totalPricePerKm,
      transferPrice,
      palletPrice,
      totalPrice,
    };

    return res.json(jsonData);
  }
}
