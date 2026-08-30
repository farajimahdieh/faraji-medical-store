import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  record(
    actorAdminId: string,
    action: string,
    entityType: string,
    entityId: string | null = null,
    metadata: Record<string, unknown> | null = null,
  ): Promise<AuditLog> {
    return this.auditLogRepo.save(
      this.auditLogRepo.create({
        actorAdminId,
        action,
        entityType,
        entityId,
        metadata,
      }),
    );
  }

  async list(page: number, limit: number) {
    const [items, total] = await this.auditLogRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }
}
