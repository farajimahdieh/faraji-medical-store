import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { SuperAdminOnly } from '../auth/decorators/admin-guards.decorator';

@SuperAdminOnly()
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogService.list(query.page, query.limit);
  }
}
