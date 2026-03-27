import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '@nestjs/common';

describe('AppService', () => {
  let service: AppService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('getPalletPrice', () => {
    it('should return 0 for quantity <= 120 without loading', async () => {
      const result = await service.getPalletPrice(100, false);
      expect(result).toBe(0);
    });

    it('should return 0 for quantity = 120 without loading', async () => {
      const result = await service.getPalletPrice(120, false);
      expect(result).toBe(0);
    });

    it('should calculate pallet price for quantity <= 55 with loading', async () => {
      const result = await service.getPalletPrice(50, true);
      expect(result).toBe(5000); // 1 pallet * 5000
    });

    it('should calculate pallet price for quantity > 120 without loading', async () => {
      const result = await service.getPalletPrice(150, false);
      expect(result).toBeGreaterThan(0);
    });

    it('should calculate correct number of pallets for larger quantities', async () => {
      const result = await service.getPalletPrice(200, true);
      expect(result).toBeGreaterThan(5000); // More than 1 pallet
    });
  });

  describe('getProductPrice', () => {
    it('should calculate price for grass type 1 in range 1-200', async () => {
      const result = await service.getProductPrice(100, 1);
      expect(result).toBe(100 * 2028); // 202,800
    });

    it('should calculate price for grass type 1 in range 201-400', async () => {
      const result = await service.getProductPrice(300, 1);
      expect(result).toBe(300 * 1969); // 590,700
    });

    it('should calculate price for grass type 1 in range 400+', async () => {
      const result = await service.getProductPrice(450, 1);
      expect(result).toBe(450 * 1941); // 873,450
    });

    it('should calculate price for grass type 2', async () => {
      const result = await service.getProductPrice(100, 2);
      expect(result).toBe(100 * 2028);
    });

    it('should calculate price for grass type 3', async () => {
      const result = await service.getProductPrice(100, 3);
      expect(result).toBe(100 * 2028);
    });

    it('should return null for invalid grass type', async () => {
      const result = await service.getProductPrice(100, 4);
      expect(result).toBeNull();
    });

    it('should handle boundary at 200 m²', async () => {
      const result200 = await service.getProductPrice(200, 1);
      const result201 = await service.getProductPrice(201, 1);
      expect(result200).toBe(200 * 2028);
      expect(result201).toBe(201 * 1969);
    });

    it('should handle boundary at 400 m²', async () => {
      const result400 = await service.getProductPrice(400, 1);
      const result401 = await service.getProductPrice(401, 1);
      expect(result400).toBe(400 * 1969);
      expect(result401).toBe(401 * 1941);
    });
  });

  describe('getLoadingPricePerKm', () => {
    it('should return 0 for quantity <= 120 without loading', async () => {
      const result = await service.getLoadingPricePerKm(100, false);
      expect(result).toBe(0);
    });

    it('should return loading price for quantity <= 400 with loading', async () => {
      const result = await service.getLoadingPricePerKm(200, true);
      expect(result).toBe(800 - 500); // transferPriceFrom121To400 - basePricePerKm = 300
    });

    it('should return loading price for quantity > 400 with loading', async () => {
      const result = await service.getLoadingPricePerKm(450, true);
      expect(result).toBe(800 - 500); // transferPriceFrom401To500 - basePricePerKm = 300
    });

    it('should return loading price for quantity > 120 without loading', async () => {
      const result = await service.getLoadingPricePerKm(150, false);
      expect(result).toBe(300);
    });
  });

  describe('getTransferPrice', () => {
    it('should return minimum price without loading when calculated price is below minimum', async () => {
      const result = await service.getTransferPrice(false, 10000);
      expect(result).toBe(20000); // minTransferPriceWithoutLoading
    });

    it('should return calculated price without loading when above minimum', async () => {
      const result = await service.getTransferPrice(false, 25000);
      expect(result).toBe(25000);
    });

    it('should return calculated price with loading when above minimum', async () => {
      const result = await service.getTransferPrice(true, 35000);
      expect(result).toBe(35000);
    });

    it('should handle edge case at minimum without loading', async () => {
      const result = await service.getTransferPrice(false, 20000);
      expect(result).toBe(20000);
    });
  });

  describe('getFeeToBudapest', () => {
    it('should return correct fee for small quantity', async () => {
      const result = await service.getFeeToBudapest(50);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return correct fee for medium quantity', async () => {
      const result = await service.getFeeToBudapest(200);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for quantity above all thresholds', async () => {
      const result = await service.getFeeToBudapest(1000);
      expect(result).toBe(0);
    });
  });

  describe('getTransferDataToBudapest', () => {
    it('should return complete transfer data object', async () => {
      const result = await service.getTransferDataToBudapest(100, 5000);
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('transfer');
      expect(result).toHaveProperty('palletPrice');
      expect(result).toHaveProperty('totalPrice');
      expect(result.quantity).toBe(100);
      expect(result.palletPrice).toBe(5000);
    });

    it('should calculate total price correctly', async () => {
      const result = await service.getTransferDataToBudapest(100, 5000);
      expect(result.totalPrice).toBe(result.transfer + result.palletPrice);
    });
  });

  describe('findDistanceTo', () => {
    it('should successfully fetch distance from Google API', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          routes: [{ distanceMeters: 50000 }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.findDistanceTo(1011);
      expect(result.routes[0].distanceMeters).toBe(50000);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('routes.googleapis.com'),
        expect.objectContaining({
          origin: { address: '6088 Magyarország' },
          destination: { address: '1011 Magyarország' },
        }),
      );
    });

    it('should throw BadRequestException when API fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('API Error')));

      await expect(service.findDistanceTo(1011)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateDistance', () => {
    it('should return cached distance for m0 ZIP codes', async () => {
      // Using a known m0 ZIP from budapest.agglomeration.ts (2009 = 155 km)
      const result = await service.calculateDistance(2009);
      expect(result).toBe(155);
    });

    it('should calculate distance via API for non-m0 ZIP codes', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          routes: [{ distanceMeters: 50000 }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.calculateDistance(9999);
      expect(result).toBeGreaterThan(0);
      // Distance should be (50000 + 5) / 1000 * 2 = 100 km
      expect(result).toBe(100);
    });
  });
});
