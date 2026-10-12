import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import {
  PublicOrderDetail,
  PublicOrderSummary,
  toPublicOrderDetail,
  toPublicOrderSummary,
} from './order.public';
import { StorageService } from '../storage/storage.service';
import { AuditLogService } from '../admin/audit-log.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const DETAIL_RELATIONS = { items: { product: { images: true } } } as const;

// Admin counterpart to OrdersService -- lists/reads across all customers,
// and lets staff move an order along (confirmed by phone, paid, shipped...).
// Prices and items are never editable here.
@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly storageService: StorageService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{
    items: PublicOrderSummary[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [orders, total] = await this.orderRepo.findAndCount({
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orders.map(toPublicOrderSummary), total, page, limit };
  }

  async findOne(id: string): Promise<PublicOrderDetail> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: DETAIL_RELATIONS,
    });
    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد');
    }
    return toPublicOrderDetail(order, (key) =>
      this.storageService.resolveUrl(key),
    );
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actorId: string,
  ): Promise<PublicOrderDetail> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد');
    }
    const before = { status: order.status, paymentStatus: order.paymentStatus };
    if (dto.status) order.status = dto.status;
    if (dto.paymentStatus) order.paymentStatus = dto.paymentStatus;
    await this.orderRepo.save(order);
    await this.auditLog.record(actorId, 'order.update-status', 'order', id, {
      before,
      after: { status: order.status, paymentStatus: order.paymentStatus },
    });
    return this.findOne(id);
  }
}
