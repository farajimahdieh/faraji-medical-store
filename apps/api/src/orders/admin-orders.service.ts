import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { PublicOrderDetail, PublicOrderSummary, toPublicOrderDetail, toPublicOrderSummary } from './order.public';
import { StorageService } from '../storage/storage.service';

const DETAIL_RELATIONS = { items: { product: { images: true } } } as const;

// View-only counterpart to OrdersService for the admin panel -- lists/reads
// across all customers instead of scoping to the current user.
@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ items: PublicOrderSummary[]; total: number; page: number; limit: number }> {
    const [orders, total] = await this.orderRepo.findAndCount({
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orders.map(toPublicOrderSummary), total, page, limit };
  }

  async findOne(id: string): Promise<PublicOrderDetail> {
    const order = await this.orderRepo.findOne({ where: { id }, relations: DETAIL_RELATIONS });
    if (!order) {
      throw new NotFoundException('سفارش مورد نظر یافت نشد');
    }
    return toPublicOrderDetail(order, (key) => this.storageService.resolveUrl(key));
  }
}
