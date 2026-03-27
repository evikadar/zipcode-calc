import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (POST) - should calculate price for valid Budapest ZIP', () => {
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
      });
  });

  it('/ (POST) - should return 404 for invalid ZIP code', () => {
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

  it('/ (POST) - should return 404 for quantity exceeding 550', () => {
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
});
