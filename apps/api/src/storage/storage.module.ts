import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { ArvanS3StorageProvider } from './arvan-s3-storage.provider';
import { StorageService } from './storage.service';
import { ImageService } from './image.service';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalDiskStorageProvider,
    ArvanS3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalDiskStorageProvider, ArvanS3StorageProvider],
      useFactory: (
        configService: ConfigService,
        localDisk: LocalDiskStorageProvider,
        arvan: ArvanS3StorageProvider,
      ) =>
        configService.get('STORAGE_DRIVER') === 'arvan' ? arvan : localDisk,
    },
    StorageService,
    ImageService,
  ],
  exports: [StorageService, ImageService, STORAGE_PROVIDER],
})
export class StorageModule {}
