import { Prices } from 'src/route.interface';

export const basePricePerKm = 370;
export const transferPriceFrom121To400 = 630;
export const transferPriceFrom401To500 = 670;
export const pricePerPallet = 3500;
// if there is no loading, the transfer price must be at least this much
export const minTransferPrice = 15750;

// 1: SPORT, 2: MEDITERRAN, 3: REGEN
export const prices: Prices = {
  1: {
    '1-200': 1925,
    '201-400': 1866,
    '400+': 1827,
  },
  2: {
    '1-200': 1925,
    '201-400': 1866,
    '400+': 1827,
  },
  3: {
    '1-200': 1925,
    '201-400': 1866,
    '400+': 1827,
  },
};
