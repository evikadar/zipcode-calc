import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class CustomParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        'For zip number and quantity we expect ONLY numbers. You provided something else in the URL.',
      );
    }
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      throw new BadRequestException(
        'For zip number and quantity we expect numbers. You provided something else in the URL.',
      );
    }

    return parsedValue;
  }
}
