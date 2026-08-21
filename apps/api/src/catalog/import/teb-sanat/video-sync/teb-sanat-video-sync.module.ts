import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CatalogModule } from '../../../catalog.module';
import { typeOrmModuleOptions } from '../../../../database/typeorm-options';
import { TebSanatVideoSyncService } from './teb-sanat-video-sync.service';

// Standalone bootstrap module for the `sync:teb-sanat-videos` CLI script —
// mirrors TebSanatImportModule: only the catalog repositories, not the
// full AppModule.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmModuleOptions()),
    CatalogModule,
  ],
  providers: [TebSanatVideoSyncService],
  exports: [TebSanatVideoSyncService],
})
export class TebSanatVideoSyncModule {}
