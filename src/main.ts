import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';

(async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: '*' });
  app.setGlobalPrefix('api/v1');
  app.useStaticAssets(join(__dirname, '/public'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  );
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);
  await app.listen(3040);
})();
