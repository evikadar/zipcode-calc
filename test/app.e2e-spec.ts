import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  prices,
  minTransferPriceWithoutLoading,
} from './../src/util/constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Valid pricing calculations', () => {
    it('should calculate price for Budapest ZIP with grass type 1', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('productPrice');
          expect(res.body).toHaveProperty('transferPrice');
          expect(res.body).toHaveProperty('palletPrice');
          expect(res.body).toHaveProperty('totalPrice');
          expect(res.body.productPrice).toBe(100 * prices[1]['1-200']);
          expect(res.body.palletPrice).toBe(0); // <= 120 without loading
        });
    });

    it('should calculate price for grass type 2 (MEDITERRAN)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: false,
          grassType: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(100 * prices[2]['1-200']);
        });
    });

    it('should calculate price for grass type 3 (REGEN)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: false,
          grassType: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(100 * prices[3]['1-200']);
        });
    });

    it('should calculate price for quantity in range 201-400', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 300,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(300 * prices[1]['201-400']);
        });
    });

    it('should calculate price for quantity in range 400+', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 450,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(450 * prices[1]['400+']);
        });
    });

    it('should include pallet price when quantity > 120', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 150,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });

    it('should include pallet price when loading is required', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: true,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });
  });

  describe('Edge cases and boundaries', () => {
    it('should handle quantity exactly at 120 without loading (no pallet fee)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 120,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBe(0);
        });
    });

    it('should handle quantity exactly at 200 (boundary)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 200,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(200 * prices[1]['1-200']);
        });
    });

    it('should handle quantity exactly at 400 (boundary)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 400,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(400 * prices[1]['201-400']);
        });
    });

    it('should handle maximum allowed quantity (550)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 550,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalPrice');
        });
    });

    it('should handle minimum quantity (1)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 1,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(prices[1]['1-200']);
        });
    });
  });

  describe('Validation errors', () => {
    it('should return 404 for invalid ZIP code', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 9999,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(404);
    });

    it('should return 404 for quantity exceeding 550', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 551,
          needsLoading: false,
          grassType: 1,
        })
        .expect(404);
    });

    it('should return 404 for invalid grass type (0)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: false,
          grassType: 0,
        })
        .expect(404);
    });

    it('should return 404 for invalid grass type (4)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 100,
          needsLoading: false,
          grassType: 4,
        })
        .expect(404);
    });

    it('should return 404 for quantity of 0', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 0,
          needsLoading: false,
          grassType: 1,
        })
        .expect(404);
    });

    it('should return 404 for negative quantity', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: -10,
          needsLoading: false,
          grassType: 1,
        })
        .expect(404);
    });
  });

  describe('Different ZIP codes', () => {
    it('should handle different Budapest ZIP codes (1XXX)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1051,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201);
    });

    it('should handle another Budapest ZIP code', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1122,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201);
    });
  });

  describe('Loading scenarios', () => {
    it('should handle loading with small quantity', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 50,
          needsLoading: true,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });

    it('should handle loading with large quantity', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 500,
          needsLoading: true,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });

    it('should handle no loading with quantity at boundary (120)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 120,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBe(0);
        });
    });

    it('should handle no loading with quantity above boundary (121)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 1011,
          quantity: 121,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });
  });

  describe('Non-Budapest ZIP codes - M0 cached distances', () => {
    it('should calculate price for m0 ZIP code 2009 (cached distance 155km)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 2009,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('productPrice');
          expect(res.body).toHaveProperty('transferPrice');
          expect(res.body).toHaveProperty('palletPrice');
          expect(res.body).toHaveProperty('totalPrice');
          expect(res.body.productPrice).toBe(100 * prices[1]['1-200']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
        });
    });

    it('should calculate price for m0 ZIP code 2015 (cached distance 164km)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 2015,
          quantity: 200,
          needsLoading: false,
          grassType: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(200 * prices[2]['1-200']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
        });
    });

    it('should calculate price for m0 ZIP code 2028 (cached distance 153km)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 2028,
          quantity: 150,
          needsLoading: true,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.transferPrice).toBeGreaterThan(0);
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });
  });

  describe('Non-Budapest ZIP codes - Agglomeration', () => {
    it('should calculate price for agglomeration ZIP code 2000', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 2000,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('productPrice');
          expect(res.body).toHaveProperty('transferPrice');
          expect(res.body).toHaveProperty('palletPrice');
          expect(res.body).toHaveProperty('totalPrice');
          expect(res.body.productPrice).toBe(100 * prices[1]['1-200']);
        });
    });

    it('should calculate price for agglomeration ZIP code 2100', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 2100,
          quantity: 250,
          needsLoading: false,
          grassType: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(250 * prices[3]['201-400']);
        });
    });
  });

  describe('Non-Budapest ZIP codes - Regular cities (requires Google Maps API)', () => {
    it('should calculate price for Debrecen (4000)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 4000,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('productPrice');
          expect(res.body).toHaveProperty('transferPrice');
          expect(res.body).toHaveProperty('palletPrice');
          expect(res.body).toHaveProperty('totalPrice');
          expect(res.body.productPrice).toBe(100 * prices[1]['1-200']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
        });
    });

    it('should calculate price for Szeged (6720)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 6720,
          quantity: 150,
          needsLoading: false,
          grassType: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(150 * prices[2]['1-200']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
        });
    });

    it('should calculate price for Pécs (7621)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 7621,
          quantity: 200,
          needsLoading: true,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(200 * prices[1]['1-200']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
          expect(res.body.palletPrice).toBeGreaterThan(0);
        });
    });

    it('should calculate price for Győr (9021)', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 9021,
          quantity: 300,
          needsLoading: false,
          grassType: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productPrice).toBe(300 * prices[3]['201-400']);
          expect(res.body.transferPrice).toBeGreaterThan(0);
        });
    });

    it('should apply minimum transfer price for short distances', () => {
      return request(app.getHttpServer())
        .post('/')
        .send({
          zipNumber: 6000,
          quantity: 100,
          needsLoading: false,
          grassType: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.transferPrice).toBeGreaterThanOrEqual(
            minTransferPriceWithoutLoading,
          );
        });
    });
  });
});
