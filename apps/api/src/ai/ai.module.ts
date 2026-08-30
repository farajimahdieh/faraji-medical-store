import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { MockAiProvider } from './providers/mock-ai-provider';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage]),
    AuthModule,
    CatalogModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiConversationService,
    MockAiProvider,
    // Provider swap is a config change (AI_PROVIDER=mock|openai), not a code
    // change -- once a real provider exists it's added as another branch
    // here, same as StorageModule's STORAGE_DRIVER factory.
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, MockAiProvider],
      useFactory: (_configService: ConfigService, mock: MockAiProvider) => mock,
    },
  ],
})
export class AiModule {}
