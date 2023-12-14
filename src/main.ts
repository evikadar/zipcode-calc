import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://eurogreen-store.myshopify.com', 'https://eurogreen.hu'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
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
