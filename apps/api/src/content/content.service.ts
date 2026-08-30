import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContent } from './entities/site-content.entity';
import { UpdateContentDto } from './dto/update-content.dto';
import { AuditLogService } from '../admin/audit-log.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(SiteContent)
    private readonly contentRepo: Repository<SiteContent>,
    private readonly auditLog: AuditLogService,
  ) {}

  list(): Promise<SiteContent[]> {
    return this.contentRepo.find({ order: { key: 'ASC' } });
  }

  async getByKey(key: string): Promise<SiteContent> {
    const content = await this.contentRepo.findOneBy({ key });
    if (!content) {
      throw new NotFoundException('محتوا یافت نشد');
    }
    return content;
  }

  async update(
    key: string,
    dto: UpdateContentDto,
    actorId: string,
  ): Promise<SiteContent> {
    const content = await this.getByKey(key);
    content.title = dto.title;
    content.body = dto.body;
    await this.contentRepo.save(content);
    await this.auditLog.record(actorId, 'content.update', 'site-content', key);
    return content;
  }
}
