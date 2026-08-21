import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { typeOrmModuleOptions } from './database/typeorm-options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot(typeOrmModuleOptions()),

    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),

    UsersModule,
    AuthModule,
    CatalogModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
