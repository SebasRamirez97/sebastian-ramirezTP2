import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('PublicacionesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/publicaciones (GET) - Debe requerir autenticación', () => {
    return request(app.getHttpServer())
      .get('/publicaciones')
      .expect(401); // Esperamos un 401 porque no enviamos token JWT en esta prueba básica
  });
});