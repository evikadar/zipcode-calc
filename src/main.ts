import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://eurogreen-store.myshopify.com', 'https://eurogreen.hu'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  });

  // Explicitly set headers for preflight requests
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Origin',
        'https://eurogreen-store.myshopify.com',
      );
      res.header(
        'Access-Control-Allow-Methods',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      );
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
      res.status(204).send();
    } else {
      next();
    }
  });

  // Ignore favicon requests
  app.use((req, res, next) => {
    if (req.originalUrl === '/favicon.ico') {
      res.status(204).end();
    } else {
      next();
    }
  });

  await app.listen(3000);
}
bootstrap();
