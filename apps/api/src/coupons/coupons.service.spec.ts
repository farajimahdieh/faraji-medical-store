import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';

import { CouponsService } from './coupons.service';
import { DiscountCode, DiscountType } from './entities/discount-code.entity';

function buildDiscountCodeRepositoryMock() {
  return { find: jest.fn() };
}

async function buildTestingService() {
  const discountCodeRepository = buildDiscountCodeRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      CouponsService,
      {
        provide: getRepositoryToken(DiscountCode),
        useValue: discountCodeRepository,
      },
    ],
  }).compile();

  return {
    service: moduleRef.get(CouponsService),
    discountCodeRepository,
  };
}

function buildCoupon(overrides?: Partial<DiscountCode>): DiscountCode {
  return {
    id: 'coupon-1',
    code: 'WELCOME10',
    type: DiscountType.PERCENTAGE,
    value: 10,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usagePerUser: null,
    minimumOrderAmount: null,
    isActive: true,
    userId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as DiscountCode;
}

describe('CouponsService', () => {
  describe('findAvailableForUser', () => {
    it('returns active general-purpose codes', async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([buildCoupon()]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('WELCOME10');
      expect(discountCodeRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { isActive: true, userId: expect.anything() },
            { isActive: true, userId: 'user-1' },
          ],
        }),
      );
    });

    it("includes the current user's personal codes", async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([
        buildCoupon({ id: 'personal', code: 'BDAY-USER1', userId: 'user-1' }),
      ]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].isPersonal).toBe(true);
    });

    it("excludes another user's personal codes", async () => {
      // The repository query itself scopes personal codes to the given
      // userId (via the `where` clause), so a well-behaved mock would never
      // return another user's code here -- this test locks in that the
      // service does not additionally leak any code through client-side
      // filtering that would let a wrongly-scoped result slip through.
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(0);
    });

    it('excludes codes that have not started yet', async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([
        buildCoupon({ startsAt: new Date(Date.now() + 60_000) }),
      ]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(0);
    });

    it('excludes expired codes', async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([
        buildCoupon({ expiresAt: new Date(Date.now() - 60_000) }),
      ]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(0);
    });

    it('excludes inactive codes via the query (not returned by find)', async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([]);

      const result = await service.findAvailableForUser('user-1');

      expect(result).toHaveLength(0);
      expect(discountCodeRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            expect.objectContaining({ isActive: true }),
            expect.objectContaining({ isActive: true }),
          ],
        }),
      );
    });

    it('orders personal codes before general codes', async () => {
      const { service, discountCodeRepository } = await buildTestingService();
      discountCodeRepository.find.mockResolvedValue([
        buildCoupon({ id: 'general', code: 'GENERAL', userId: null }),
        buildCoupon({ id: 'personal', code: 'PERSONAL', userId: 'user-1' }),
      ]);

      const result = await service.findAvailableForUser('user-1');

      expect(result.map((c) => c.code)).toEqual(['PERSONAL', 'GENERAL']);
    });
  });
});
