import { Body, Controller, NotFoundException, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { hungarianZips } from './util/hungarianZips';
import { agglomerationZips } from './util/budapest.agglomeration';
import { Response } from 'express';

class CalculatePriceDto {
  zipNumber: number;
  quantity: number;
  needsLoading: boolean;
  grassType: number; // 1: SPORT, 2: MEDITERRAN, 3: ELITE
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/')
  async calculatePrice(
    @Body() calculatePriceDto: CalculatePriceDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { zipNumber, quantity, needsLoading, grassType } = calculatePriceDto;

    // only accept valid ZIPs
    if (!hungarianZips.includes(zipNumber)) {
      throw new NotFoundException(
        'The zipnumber you provided is not a valid Hungarian ZIP code.',
      );
    }

    if (grassType != 1 && grassType != 2 && grassType != 3) {
      throw new NotFoundException(
        `Grass type ${grassType} is invalid. Accepted values are 1, 2 and 3.`,
      );
    }

    const productPrice = await this.appService.getProductPrice(
      quantity,
      grassType,
    );

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
        await this.appService.getTransferDataToBudapest(quantity, palletPrice);

      const data = {
        quantity: budapestTransferData.quantity,
        transfer: budapestTransferData.transfer,
        productPrice,
        palletPrice: budapestTransferData.palletPrice,
        transferPrice: budapestTransferData.totalPrice,
        totalPrice: productPrice + budapestTransferData.totalPrice,
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

    const totalPrice = palletPrice + transferPrice + productPrice;

    const jsonData = {
      distanceKms,
      basePricePerKm,
      loadingPricePerKm,
      totalPricePerKm,
      transferPrice,
      palletPrice,
      productPrice,
      totalPrice,
    };

    return res.json(jsonData);
  }
}
