import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CatalogModule } from '../../catalog.module';
import { StorageModule } from '../../../storage/storage.module';
import { typeOrmModuleOptions } from '../../../database/typeorm-options';
import { TebSanatImportService } from './teb-sanat-import.service';
import { ProductMatcher } from './product-matcher';

// Standalone bootstrap module for the `import:teb-sanat` CLI script — only
// what the importer needs (catalog repositories + storage), not the full
// AppModule (auth/throttler/etc. would just be dead weight for a script).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmModuleOptions()),
    CatalogModule,
    StorageModule,
  ],
  providers: [TebSanatImportService, ProductMatcher],
  exports: [TebSanatImportService],
})
export class TebSanatImportModule {}
