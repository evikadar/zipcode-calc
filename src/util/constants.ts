import { Prices } from 'src/route.interface';

export const basePricePerKm = 430;
export const transferPriceFrom121To400 = 725;
export const transferPriceFrom401To500 = 750;
export const pricePerPallet = 5000;
// the transfer price must be at least this much with and without loading
export const minTransferPriceWithoutLoading = 20000;
export const minTransferPriceWithLoading = 30000;

// 1: SPORT, 2: MEDITERRAN, 3: REGEN
export const prices: Prices = {
  1: {
    '1-200': 1988,
    '201-400': 1929,
    '400+': 1890,
  },
  2: {
    '1-200': 1988,
    '201-400': 1929,
    '400+': 1890,
  },
  3: {
    '1-200': 1988,
    '201-400': 1929,
    '400+': 1890,
  },
};
