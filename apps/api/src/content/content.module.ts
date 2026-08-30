import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SiteContent } from './entities/site-content.entity';
import { ContentService } from './content.service';
import { AdminContentController } from './admin-content.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent]), AuthModule, AdminModule],
  controllers: [AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}
