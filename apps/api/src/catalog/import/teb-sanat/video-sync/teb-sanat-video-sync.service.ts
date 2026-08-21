import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Brand } from '../../../entities/brand.entity';
import { Product } from '../../../entities/product.entity';
import { ProductSource } from '../../../entities/product-source.entity';
import { fetchAparatChannelVideos, AparatVideo } from './aparat-client';
import { matchProductToVideos } from './video-matcher';

const BRAND_SLUG = 'teb-o-sanat';
const VIDEO_SOURCE = 'aparat';

export interface VideoSyncOptions {
  dryRun: boolean;
}

export type VideoSyncOutcome = 'matched' | 'updated' | 'needs_review';

export interface VideoSyncEntry {
  productName: string;
  outcome: VideoSyncOutcome;
  videoTitle: string;
  videoUrl: string;
  confidencePercent: number;
}

export interface VideoSyncSummary {
  productsChecked: number;
  videosFound: number;
  highConfidenceMatches: number;
  needsReview: number;
  noVideoFound: number;
  entries: VideoSyncEntry[];
}

@Injectable()
export class TebSanatVideoSyncService {
  private readonly logger = new Logger(TebSanatVideoSyncService.name);

  constructor(
    @InjectRepository(Brand) private readonly brandRepo: Repository<Brand>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductSource)
    private readonly sourceRepo: Repository<ProductSource>,
  ) {}

  async run(options: VideoSyncOptions): Promise<VideoSyncSummary> {
    const brand = await this.brandRepo.findOneBy({ slug: BRAND_SLUG });
    if (!brand) {
      throw new Error(
        'برند «طب و صنعت» پیدا نشد — اول Product Importer را اجرا کنید.',
      );
    }

    const [products, sources, videos] = await Promise.all([
      this.productRepo.findBy({ brandId: brand.id }),
      this.sourceRepo.findBy({ sourceName: 'teb-sanat' }),
      fetchAparatChannelVideos(),
    ]);

    const codeByProductId = new Map<string, string | null>();
    for (const source of sources) {
      codeByProductId.set(source.productId, source.externalProductCode);
    }

    const summary: VideoSyncSummary = {
      productsChecked: products.length,
      videosFound: videos.length,
      highConfidenceMatches: 0,
      needsReview: 0,
      noVideoFound: 0,
      entries: [],
    };

    for (const product of products) {
      const result = matchProductToVideos(
        {
          id: product.id,
          name: product.name,
          sourceCode: codeByProductId.get(product.id) ?? null,
        },
        videos,
      );

      if (result.status === 'no_match') {
        summary.noVideoFound++;
        continue;
      }

      if (result.status === 'needs_review') {
        summary.needsReview++;
        summary.entries.push({
          productName: product.name,
          outcome: 'needs_review',
          videoTitle: result.video.title,
          videoUrl: result.video.url,
          confidencePercent: Math.round(result.confidence * 100),
        });
        continue;
      }

      summary.highConfidenceMatches++;
      const alreadyLinked = product.videoUrl === result.video.url;
      summary.entries.push({
        productName: product.name,
        outcome: alreadyLinked ? 'matched' : 'updated',
        videoTitle: result.video.title,
        videoUrl: result.video.url,
        confidencePercent: Math.round(result.confidence * 100),
      });

      if (options.dryRun || alreadyLinked) continue;
      if (product.descriptionLocked) {
        this.logger.warn(
          `⚠ Skipped (descriptionLocked): ${product.name} — would have linked "${result.video.title}"`,
        );
        continue;
      }

      await this.linkVideo(product, result.video);
    }

    return summary;
  }

  private async linkVideo(product: Product, video: AparatVideo): Promise<void> {
    product.videoUrl = video.url;
    product.videoSource = VIDEO_SOURCE;
    product.videoTitle = video.title;
    await this.productRepo.save(product);
    this.logger.log(`✓ Linked: ${product.name} → ${video.title}`);
  }
}
