import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserAddress } from './entities/user-address.entity';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAddress]), AuthModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
