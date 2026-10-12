import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';

export function configureApp(app: NestExpressApplication): void {
  // Behind a CDN/reverse proxy (e.g. Arvan) every request arrives from the
  // proxy's IP, so rate limits would be shared by all visitors. TRUST_PROXY
  // = number of proxy hops in front of the API (usually 1); unset = none.
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    app.set(
      'trust proxy',
      /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy,
    );
  }

  // Security headers. Product images are loaded cross-origin by the web app.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
