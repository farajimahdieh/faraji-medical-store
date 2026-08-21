import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';

export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());

  // Locally stored product media (dev only — swap for S3/R2/etc. in prod).
  app.useStaticAssets(join(process.cwd(), 'storage'), { prefix: '/media' });

  app.enableCors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
